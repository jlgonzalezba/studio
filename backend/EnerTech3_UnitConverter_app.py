
import base64
import streamlit as st

APP_TITLE = "EnerTech3 | Conversor Universal"
TAGLINE = "Energía y tecnología en sincronía"
LOGO_PATH = "logo_enertech3.png"  # replace with your path if hosting elsewhere

def load_logo_b64(path: str) -> str:
    try:
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except Exception:
        return ""

def inject_css():
    st.markdown(
        '''
        <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap");
        :root {
            --brand:#0f2e44;
            --accent:#ff8a00;
            --bg:#f7f8fb;
            --card:#ffffff;
        }
        html, body, [class*="css"]  {
            font-family:'Inter', system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
        }
        .app-header{ display:flex; align-items:center; gap:18px; margin-bottom:16px; }
        .brand{ color:var(--brand); }
        .brand h1{ font-weight:800; margin:0; font-size:28px; letter-spacing:.2px; }
        .brand p{ margin:.25rem 0 0; color:#4b5563; font-weight:500 }
        .card{ background:var(--card); border-radius:18px; padding:22px; box-shadow:0 10px 25px rgba(15,46,68,.08); border:1px solid rgba(15,46,68,.06); }
        .metric{ display:grid; grid-template-columns:1fr auto; gap:6px; align-items:end; margin-top:10px }
        .metric .value{ font-size:32px; font-weight:800; color:var(--brand) }
        .metric .unit{ font-weight:700; color:#6b7280 }
        .footer-note{ opacity:.7; font-size:12px; margin-top:18px }
        .deep-bg { background: linear-gradient(180deg, #f9fbff 0%, #eef4ff 100%); padding: 10px 18px 2px 18px; border-radius:18px; border:1px solid rgba(15,46,68,.05); }
        </style>
        ''',
        unsafe_allow_html=True
    )

# ---------------------- Factors ----------------------
LENGTH = {
    "metro (m)": 1,
    "kilómetro (km)": 1000,
    "centímetro (cm)": 0.01,
    "milímetro (mm)": 0.001,
    "micrómetro (µm)": 1e-6,
    "nanómetro (nm)": 1e-9,
    "pulgada (in)": 0.0254,
    "pie (ft)": 0.3048,
    "yarda (yd)": 0.9144,
    "milla (mi)": 1609.344,
    "milla náutica (nmi)": 1852,
}
MASS = {
    "kilogramo (kg)": 1,
    "gramo (g)": 0.001,
    "miligramo (mg)": 1e-6,
    "microgramo (µg)": 1e-9,
    "tonelada métrica (t)": 1000,
    "tonelada corta EUA (ton US)": 907.18474,
    "libra (lb)": 0.45359237,
    "onza (oz)": 0.028349523125,
}
TIME = {
    "segundo (s)": 1,
    "milisegundo (ms)": 1e-3,
    "microsegundo (µs)": 1e-6,
    "minuto (min)": 60,
    "hora (h)": 3600,
    "día (d)": 86400,
    "semana (wk)": 604800,
}
CURRENT = {
    "ampere (A)": 1,
    "milliampere (mA)": 1e-3,
    "microampere (µA)": 1e-6,
    "kiloampere (kA)": 1e3,
}
AMOUNT = {
    "mol (mol)": 1,
    "milimol (mmol)": 1e-3,
    "micromol (µmol)": 1e-6,
}
LUMINOUS = {
    "candela (cd)": 1,
    "millicandela (mcd)": 1e-3,
    "kilocandela (kcd)": 1e3,
}
TEMP_UNITS = ["Celsius (°C)", "Fahrenheit (°F)", "Kelvin (K)"]

def to_si(value: float, factors: dict, unit_from: str) -> float:
    return value * factors[unit_from]

def from_si(value_si: float, factors: dict, unit_to: str) -> float:
    return value_si / factors[unit_to]

def convert_linear(value: float, factors: dict, u_from: str, u_to: str) -> float:
    return from_si(to_si(value, factors, u_from), factors, u_to)

def convert_temperature(value: float, u_from: str, u_to: str) -> float:
    if u_from == u_to:
        return value
    # to Kelvin
    if u_from.startswith("Celsius"):
        k = value + 273.15
    elif u_from.startswith("Fahrenheit"):
        k = (value - 32) * 5.0/9.0 + 273.15
    else:  # Kelvin
        k = value
    # from Kelvin
    if u_to.startswith("Celsius"):
        return k - 273.15
    elif u_to.startswith("Fahrenheit"):
        return (k - 273.15) * 9.0/5.0 + 32
    else:
        return k

def format_number(x: float) -> str:
    if x == 0:
        return "0"
    if abs(x) < 1e-3 or abs(x) >= 1e6:
        return f"{x:.6e}"
    if abs(x) < 1:
        return f"{x:.6f}".rstrip('0').rstrip('.')
    return f"{x:,.6f}".rstrip('0').rstrip('.')

def header():
    logo_b64 = load_logo_b64(LOGO_PATH)
    st.markdown('<div class="deep-bg card">', unsafe_allow_html=True)
    colA, colB = st.columns([1,6])
    with colA:
        if logo_b64:
            st.markdown(f'<img src="data:image/png;base64,{logo_b64}" style="width:100%;max-width:110px;border-radius:16px;">', unsafe_allow_html=True)
    with colB:
        st.markdown(
            f'''
            <div class="app-header">
                <div class="brand">
                    <h1>{APP_TITLE}</h1>
                    <p>{TAGLINE}</p>
                </div>
            </div>
            ''',
            unsafe_allow_html=True
        )
    st.markdown('</div>', unsafe_allow_html=True)

def converter_card(title: str, factors: dict | None, temp: bool=False):
    st.markdown(f"### {title}")
    with st.container():
        col1, col2 = st.columns(2)
        with col1:
            value = st.number_input("Valor", value=1.0, step=1.0, format="%.8f", key=f"val-{title}")
            if temp:
                u_from = st.selectbox("Desde", TEMP_UNITS, key=f"from-{title}")
                u_to = st.selectbox("Hacia", TEMP_UNITS, key=f"to-{title}")
            else:
                units = list(factors.keys())
                u_from = st.selectbox("Desde", units, key=f"from-{title}")
                u_to = st.selectbox("Hacia", units, key=f"to-{title}")
        with col2:
            if st.button("Convertir", use_container_width=True, key=f"btn-{title}"):
                try:
                    if temp:
                        res = convert_temperature(value, u_from, u_to)
                    else:
                        res = convert_linear(value, factors, u_from, u_to)
                    st.session_state[f"res-{title}"] = (res, u_to)
                except Exception as e:
                    st.error(f"Error: {e}")
            res_key = f"res-{title}"
            if res_key in st.session_state:
                res, u_unit = st.session_state[res_key]
                st.markdown('<div class="card">', unsafe_allow_html=True)
                st.markdown('<div class="metric">', unsafe_allow_html=True)
                st.markdown(f'<div class="value">{format_number(res)}</div>', unsafe_allow_html=True)
                st.markdown(f'<div class="unit">{u_unit}</div>', unsafe_allow_html=True)
                st.markdown('</div>', unsafe_allow_html=True)
                st.markdown('</div>', unsafe_allow_html=True)

def main():
    st.set_page_config(page_title="EnerTech3 | Conversor Universal", page_icon="🔥", layout="centered")
    inject_css()
    header()
    st.markdown("Convierte rápidamente entre unidades base del **SI** y algunas unidades de uso común.")
    tabs = st.tabs(["Longitud","Masa","Tiempo","Corriente eléctrica","Temperatura","Cantidad de sustancia","Intensidad luminosa"])
    with tabs[0]:
        converter_card("Longitud", LENGTH)
    with tabs[1]:
        converter_card("Masa", MASS)
    with tabs[2]:
        converter_card("Tiempo", TIME)
    with tabs[3]:
        converter_card("Corriente eléctrica", CURRENT)
    with tabs[4]:
        converter_card("Temperatura", None, temp=True)
    with tabs[5]:
        converter_card("Cantidad de sustancia", AMOUNT)
    with tabs[6]:
        converter_card("Intensidad luminosa", LUMINOUS)
    st.markdown('<div class="footer-note">© EnerTech3 — Conversor construido en Python/Streamlit.</div>', unsafe_allow_html=True)

if __name__ == "__main__":
    main()
