
import pandas as pd

pipes_data=[

    {"OD": 5.0, "ID": 4.494, "WEIGHT":13.00},
    {"OD": 5.0, "ID": 4.408, "WEIGHT":15.00},
    {"OD": 5.0, "ID": 4.276, "WEIGHT":18.00},
    {"OD": 5.0, "ID": 4.126, "WEIGHT":21.40},
   
    
    {"OD": 5.5, "ID": 5.012, "WEIGHT":14.00},
    {"OD": 5.5, "ID": 4.950, "WEIGHT":15.50},
    {"OD": 5.5, "ID": 4.892, "WEIGHT":17.00},
    {"OD": 5.5, "ID": 4.778, "WEIGHT":20.00},
    {"OD": 5.5, "ID": 4.670, "WEIGHT":23.00},


    
    {"OD": 7.0, "ID": 6.456, "WEIGHT":20.00},
    {"OD": 7.0, "ID": 6.366, "WEIGHT":23.00},
    {"OD": 7.0, "ID": 6.276, "WEIGHT":26.00},
    {"OD": 7.0, "ID": 6.184, "WEIGHT":29.00},
    {"OD": 7.0, "ID": 6.094, "WEIGHT":32.00},
    {"OD": 7.0, "ID": 6.004, "WEIGHT":35.00},
    {"OD": 7.0, "ID": 5.920, "WEIGHT":38.00},


    {"OD": 9.625, "ID": 9.001, "WEIGHT":32.30},
    {"OD": 9.625, "ID": 8.921, "WEIGHT":36.00},
    {"OD": 9.625, "ID": 8.835, "WEIGHT":40.00},
    {"OD": 9.625, "ID": 8.755, "WEIGHT":43.50},
    {"OD": 9.625, "ID": 8.861, "WEIGHT":47.00},
    {"OD": 9.625, "ID": 8.535, "WEIGHT":53.50},

    
]


pipes_data = pd.DataFrame(pipes_data)