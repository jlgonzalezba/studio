import pandas as pd
import os
import re
from df_manage import get_latest_csv_dataframe
import numpy as np




# definir constantes

finger_jump = 0.018 # ajustar según la sensibilidad deseada, cambios mayores a este valor se consideran significativos
finger_jump_slim = 0.014
threshold = 0.55  # umbral para considerar un cambio significativo en la mayoría de los dedos, porcentaje
slim_threshold = 0.5
slim_threshold_1 = 0.4  # umbral para detectar cuellos delgados, porcentaje
collar_lenght_steps = 20  # con un step de 0.1 ft, XX pasos  para funcion range() = XX*0.1 ft de longitud máxima del cuello



#leer el último archivo CSV centralizado exportado en "exports"
def read_latest_centralized_csv():
    """
    Lee el último archivo CSV centralizado de la carpeta exports
    """
    df, filename = get_latest_csv_dataframe(use_centralized=True)
    if df is None:
        print(f"[ERROR] No se pudo cargar el archivo CSV centralizado más reciente")
        return None, None

    print(f"[SUCCESS] CSV centralizado cargado: {filename} ({len(df)} filas, {len(df.columns)} columnas)")
    return df

df = read_latest_centralized_csv()
zero_counts = (df==0).sum(axis=1)
threshold_zero= df.shape[1]/1.5
df = df[zero_counts < threshold_zero]

# Filtrar los nombres de columnas R01-R40 y la columna DEPT o la primera columna si DEPT no existe
def curves_and_depth(df: pd.DataFrame):
    r_pattern = re.compile(r'^R\d{1,2}$')
    r_columns = [col for col in df.columns if r_pattern.match(col)]

    # Filtrar solo eg R01-R40
    valid_r_curves = []
    for col in r_columns:
        match = re.match(r'R(\d{1,2})', col)
        if match:
            valid_r_curves.append(col)
    valid_r_curves.sort()
    # Verificar si existe la columna DEPT, si no usar la primera columna
    dept = "DEPT" if "DEPT" in df.columns else df.columns[0]
    return valid_r_curves, dept

# detectar cuellos con criterios refinados: cambio en mayoría de fingers, duración 0.2-2 ft, y retorno a baseline
def to_numpy(df: pd.DataFrame):
    #crea un dataframe con solo las columnas eg R01-R40 y DEPT
    valid_r_curves, depth_col = curves_and_depth(df)
    df=df[[depth_col] +valid_r_curves]

    cols = [c for c in df.columns if c != depth_col]  # todas las columnas excepto depth_col

    # eliminar filas donde TODAS las columnas (excepto depth_col) estén vacías
    df = df.dropna(how='all', subset=cols)
    dept=df[depth_col]
    dept=dept.reset_index(drop=True)
    # Exporta el dataframe a CSV para ver si se esta creando correctamente
    df.to_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'exports', 'df.csv'), index=False)

    #convertir pandas to numpy array
    data=df.to_numpy()
    dept=dept.to_numpy()
    #calcula el gradiente de las columnas R01-R40
    return data, dept


data, dept = to_numpy(df)

# definir constantes


def grad_and_boottable(data: np.ndarray, dept: np.ndarray, finger_jump): # calcular gradiente y table booleana

    # Calculo de diferencia usando diff

    grad = np.diff(data, axis=0) #gradiente a lo largo de las filas (profundidad)
    grad = grad.round(4)  # solo 4 cifras decimales
    dept = dept[1:]  # ajustar la profundidad para que coincida con el tamaño de grad
    grad = np.delete(grad, 0 , axis = 1)

    # crear mascara booleana donde el cambio es mayor que finger_jump
    conditions=[
        grad < -finger_jump,
        (grad >= -finger_jump) & (grad <= finger_jump),
        grad > finger_jump
    ]

    choices = [ -1, 0, 1]

    mask = np.select(conditions, choices)



    conditions=[
        grad < -finger_jump_slim,
        (grad >= -finger_jump_slim) & (grad <= finger_jump_slim),
        grad > finger_jump_slim
    ]

    choices = [ -1, 0, 1]

    mask_slim = np.select(conditions, choices)

    # calcular promedio de dedos en true
    avg_fingers_changed = mask.mean(axis=1)
    avg_fingers_changed_slim = np.round(mask_slim.mean(axis=1),4)

    # insetar promedios en la utlima fila de mask
    mask = np.column_stack((mask, avg_fingers_changed))
    mask_slim = np.column_stack((mask_slim, avg_fingers_changed_slim))

    # Convertir a DataFrame y guardar a CSV del gradiente y la mascara
    grad = pd.DataFrame(grad)
    grad.insert(0, "DEPT", dept)
    grad.to_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'exports', 'grad.csv'), index=False, float_format='%.4f')

    mask = pd.DataFrame(mask)
    mask.insert(0, "DEPT", dept)
    mask.to_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'exports', 'mask.csv'), index=False, float_format='%.4f')
    mask_slim = pd.DataFrame(mask_slim)
    mask_slim.insert(0, "DEPT", dept)
    mask_slim.to_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'exports', 'mask_slim.csv'), index=False, float_format='%.4f')

    return avg_fingers_changed, avg_fingers_changed_slim, dept


grad_and_boottable(data, dept, finger_jump)
avg_fingers_changed, avg_fingers_changed_slim, dept = grad_and_boottable(data, dept, finger_jump)





# funcion para detectar cuellos delgados

def detect_slim_collars(avg_fingers_changed_slim: np.ndarray, dept: np.ndarray, collars: np.ndarray, slim_threshold, slim_threshold_1):
    slim_collars = np.empty((0,2)) # almacenar los cuellos delgados detectados (profundidad inicio, profundidad fin)
    slim_collars_2 = np.empty((0,2))
    new_row = np.empty((0,2)) 
    i= 0
    M = len(collars)
    N = len(avg_fingers_changed_slim)
    j = 0


    # hacer un barrido de la data de mascara de cambio promedio, en las zonas donde collars no tiene reportados cuellos
    # solo para cambios que no son tan fuertes como los detectados en collars

    while i < M:
    
        idx = np.where(dept == collars[i,0])[0][0]
        
        

        while dept[j] < (dept[idx] -0.5):  
            score = 0
           
            if abs(avg_fingers_changed_slim[j]) > slim_threshold:
  
                if abs(avg_fingers_changed_slim[j+1]) < slim_threshold and abs(avg_fingers_changed_slim[j-1]) < slim_threshold:
                    

                    for k in range(2,5):
                        if abs(avg_fingers_changed_slim[j+k]) < slim_threshold_1 and abs(avg_fingers_changed_slim[j-k]) < slim_threshold_1:
                            score += 1
                            
                    
                    if score >= 3:
                        
                        new_row = np.array([[dept[j-2], dept[j+2]]])
                        slim_collars = np.vstack([slim_collars, new_row])
                        j += 4
                        print(new_row)
            j += 1

        j = np.where(dept == collars[i,1])[0][0] + 5
                
        i += 1



    #Collars parecidos a los principales pero con unos thresholds mas pequeños.
    i=0
    j=0
   
    while i < M:

        idx = np.where(dept == collars[i,0])[0][0]
    

        while j < N and dept[j] < (dept[idx] -5):

            if abs(avg_fingers_changed_slim[j]) > slim_threshold:
                
                
                pivot = avg_fingers_changed_slim[j]
                dept_final = None  # Inicializar dept_final
                dept_ini = None
                x=j
                for direction in (1,-1):
                    for k in range(1,collar_lenght_steps):
                        if j + k < N:  # Verificar límites del array
                            j = j +(1*direction)
                            if pivot < 0:
                                if avg_fingers_changed_slim[j] > slim_threshold_1:
                                    dept_ini = dept[x] if x >= 4 else dept[0]  # marcar inicio del cuello 0.4 ft antes
                                    dept_final = dept[j] if j + 4 < N else dept[N-1] # marcar fin del cuello 0.4 ft después
                                
                                    
                            elif pivot > 0:
                                if avg_fingers_changed_slim[j] < -slim_threshold_1:
                                    dept_ini = dept[x] if x >= 4 else dept[0]  # marcar inicio del cuello 0.4 ft antes
                                    dept_final = dept[j] if j + 4 < N else dept[N-1] # marcar fin del cuello 0.4 ft después

                    if dept_ini is None and dept_final is None: 
                        j=x
                    elif dept_final is not None and dept_ini is not None:
                        break


                if dept_final is not None and dept_ini is not None: 
                    if dept_final > dept_ini:
                        slim_collars_2 = np.vstack([slim_collars_2, [dept_ini - 0.4, dept_final+0.4]])
                        print("\nThis is a slim collar positive")
                        print(f'{dept_ini-0.4}, {dept_final+0.4}')
                    elif dept_final < dept_ini:
                        slim_collars_2 = np.vstack([slim_collars_2, [dept_final-0.4, dept_ini+0.4]])
                        print("\nThis ais a slim collar negative")
                        print(f'{dept_final-0.4}, {dept_ini+0.4}')

                j += collar_lenght_steps*2

            j += 1
        j = np.where(dept == collars[i,1])[0][0] + 5
        i += 1


    return slim_collars,slim_collars_2


            
# funcion principal de detección de collars, todos los que sean grandes y muy distinguibles a simple vista

def detect_caliper_collars(avg_fingers_changed: np.ndarray, dept: np.ndarray,collar_lenght_steps, threshold):


    # funcion para detectar cuellos

    collars = np.empty((0,2)) # almacenar los cuellos detectados (profundidad inicio, profundidad fin)

    i= 0
    N = len(avg_fingers_changed)

    while i < N:

        if abs(avg_fingers_changed[i]) > threshold:
            
            # Sirve para detectar  cuellos en cambios de libraje, donde todos los dedos cambian pero no regresan a la posición original
            if abs(avg_fingers_changed[i]) == 1:
                dept_ini = dept[i-6] if i >= 6 else dept[0]
                dept_final = dept[i+6] if i + 6 < N else dept[N-1]
                if collars.shape[0]>0:
                    if dept_ini < (collars[-1,1] + 4): # Si el cuello detectado esta muy pegado al anterior pone como dept final del nuevo cuello
                        collars[-1,1] = dept_final
                        
                    else:
                        collars = np.vstack([collars, [dept_ini, dept_final]])
                else:
                    collars = np.vstack([collars, [dept_ini, dept_final]])

            
            dept_ini = dept[i-6] if i >= 6 else dept[0]  # marcar inicio del cuello 0.6 ft antes
            pivot = avg_fingers_changed[i]
            dept_final = None  # Inicializar dept_final
            x=i
            for j in range(1,collar_lenght_steps):
                if i + j < N:  # Verificar límites del array
                    i += 1
                    if pivot < 0:
                        
                        if avg_fingers_changed[i] > threshold:
                            dept_final = dept[i+6] if i + 6 < N else dept[N-1] # marcar fin del cuello 0.6 ft después
                           
                                               
                    elif pivot > 0:
                        
                        if avg_fingers_changed[i] < -threshold:
                            dept_final = dept[i+6] if i + 6 < N else dept[N-1] # marcar fin del cuello 0.6 ft después
                          
            if dept_final is None:
                dept_ini = None  # No se encontró un cuello válido
            if i == x:
                i+=collar_lenght_steps # avanzar si no se encontró un cuello

            if dept_final is not None and dept_ini is not None:            
                if dept_final > dept_ini:
                    # print(f'collars[-1,1]{collars[-1,1]}, dept_ini {dept_ini}')
                    if collars.shape[0]>0:
                        if dept_ini < (collars[-1,1] + 4): # Si el cuello detectado esta muy pegado al anterior pone como dept final del nuevo cuello
                            collars[-1,1] = dept_final
                            
                        else:
                            collars = np.vstack([collars, [dept_ini, dept_final]])
                    else:
                        collars = np.vstack([collars, [dept_ini, dept_final]])
                
        
        i += 1

    

      
    # Detectar collars delgados con la función detect_slim_collars
    
    slim_collars, slim_collars_2 = detect_slim_collars(avg_fingers_changed_slim, dept, collars, slim_threshold, slim_threshold_1)


    return collars,slim_collars,slim_collars_2
                

collars, slim_collars, slim_collars_2 = detect_caliper_collars(avg_fingers_changed, dept, collar_lenght_steps, threshold)


# colocar las lineas para primero y ultima junta 

def collars_top_bottom(collars, dept):
    top_raw = np.array([[np.nan,dept[0]]])
    bottom_raw = np.array([[dept[-1], np.nan]])

    if collars[0,0] == dept[0]:
       collars[0,0]=np.nan
       collars = np.vstack([collars, bottom_raw])
    else:
        collars = np.vstack([top_raw, collars, bottom_raw])

    return collars

collars = collars_top_bottom(collars, dept)



#definir promedio de juntas validas 

def collars_avg(collars):

    sum = 0
    i = 1
    joints_ok = 0
    while i < len(collars)-2:
        if (abs((collars[i,1] - collars[i+1,0])) > 25) and (abs((collars[i,1] - collars[i+1,0])) <50):
            sum += collars[i,1] - collars[i+1,0]
            joints_ok += 1
        i += 1
    avg = abs(sum/joints_ok)
    return avg

avg= collars_avg(collars)
print(avg)




# insertar los slim collars en collars original

def insert_slim_collars_and_others(collars, slim_collars, slim_collars_2, avg):

    collars_full = collars.copy()

    # For para insertar slim_collars en la tabla principal de collares
    for slim_collar in slim_collars:

        idx = np.searchsorted(collars_full[:,0], slim_collar[0])
        if idx == 0:  # si el indice cae en 0, se suma uno ya que la psicision [0,0] es nan para collars
            idx+=1
        top_distance = abs(collars_full[idx-1,1] - slim_collar[0])
        bottom_distance = abs(collars_full[idx,0] - slim_collar[1])

        if avg*0.85 < top_distance < avg*1.15 and avg*0.85<bottom_distance < avg*1.15:
            collars_full = np.insert(collars_full, idx, slim_collar, axis=0)
            print(f'Inserted slim_collar {slim_collar}, Top {top_distance} Bottom {bottom_distance}')


    # Ahora otro for para insertar slim_collars_2 en la tabla principal de collares    

    for slim_collar in slim_collars_2:

        idx = np.searchsorted(collars_full[:,0], slim_collar[0])
        if idx == 0: # si el indice cae en 0, se suma uno ya que la psicision [0,0] es nan para collars
            idx+=1
        top_distance = abs(collars_full[idx-1,1] - slim_collar[0])
        bottom_distance = abs(collars_full[idx,0] - slim_collar[1])

        if avg*0.85 < top_distance < avg*1.15 and avg*0.85<bottom_distance < avg*1.15:
            collars_full = np.insert(collars_full, idx, slim_collar, axis=0)
            print(f'Inserted slim_collar 2{slim_collar}, Top {top_distance} Bottom {bottom_distance}')
        


    #Algoritmo para aplicar cuellos por geometria, donde los algoritmos de decteccion no lo pudieron realizar
    collars_to_add = np.empty((0,2))
    for i in range(len(collars_full)-1):
        
        
        difference = abs(collars_full[i,1] - collars_full[i+1,0])
        
        if difference > avg*1.7:
         
            integer = int(difference/avg)
            decimal = (difference/avg)%1

            if decimal > 0.5:
                joints_to_add = integer
            else:
                joints_to_add = integer-1

            interval_to_add = difference/(joints_to_add+1)
            print(f'interval_to_add {interval_to_add}')
            if joints_to_add > 0:
                
                for j in range(1, joints_to_add+1):
                    collar = np.array([collars_full[i,1]+(interval_to_add*j)-1, collars_full[i,1]+(interval_to_add*j)+1])
                    collars_to_add = np.vstack([collars_to_add, collar])

                    print(f'Collar adicional a {collar}')
            print(f'Collars to add array {collars_to_add}')
    for collar in collars_to_add:


        idx = np.searchsorted(collars_full[:,0], collar[0])
        if idx == 0: # si el indice cae en 0, se suma uno ya que la psicision [0,0] es nan para collars
            idx+=1
        collars_full = np.insert(collars_full, idx, collar, axis=0)
        

    return collars_full




collars_full = insert_slim_collars_and_others(collars, slim_collars, slim_collars_2, avg)

collars_copy = collars.copy()

collars = collars_full.copy()

                    
               
            
                    


        







#exportar array collars a pandas y csv
collars= pd.DataFrame(collars)
collars.to_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'exports', 'collars.csv'), index=False, float_format='%.4f')
collars_copy= pd.DataFrame(collars_copy)
collars_copy.to_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'exports', 'collars_copy.csv'), index=False, float_format='%.4f')
slim_collars= pd.DataFrame(slim_collars)
slim_collars.to_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'exports', 'slim_collars.csv'), index=False, float_format='%.4f')
slim_collars_2= pd.DataFrame(slim_collars_2)
slim_collars_2.to_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'exports', 'slim_collars_2.csv'), index=False)





    
