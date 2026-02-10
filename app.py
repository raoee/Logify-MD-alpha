import streamlit as st
import pandas as pd
from sqlalchemy import text
from datetime import date
import re

# --- 1. Configuration & Layout ---
st.set_page_config(
    page_title="Research Hub",
    page_icon="🧬",
    layout="wide"
)

# Custom Styling for "God Mode" look
st.markdown("""
<style>
    .stMetric {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 15px;
        border-radius: 12px;
    }
    div.stButton > button:first-child {
        background-color: #2563eb;
        color: white;
        font-weight: 500;
        border-radius: 8px;
        padding: 0.5rem 1rem;
    }
    div[data-testid="stExpander"] {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
    }
</style>
""", unsafe_allow_html=True)

# --- 2. Database Engine ---
try:
    # ttl=0 ensures we always see the latest schema changes
    conn = st.connection('research_db', type='sql')
except Exception as e:
    st.error(f"🔌 Database Disconnected: {e}")
    st.stop()

# Helper: Sanitize inputs for DDL statements (Table/Column names)
def clean_identifier(name):
    # Only allow alphanumeric and underscores
    clean = re.sub(r'[^a-zA-Z0-9_]', '_', name.strip())
    return clean.lower()

# --- 3. Sidebar: Navigation & Creation ---
with st.sidebar:
    st.title("🗂️ Workspace")
    
    # Fetch active studies
    try:
        tables_df = conn.query("SHOW TABLES", ttl=0)
        tables = tables_df.iloc[:, 0].tolist() if not tables_df.empty else []
    except:
        tables = []
        
    selected_study = st.selectbox("Active Study", tables, index=0 if tables else None)
    
    st.divider()
    
    # "God Mode": Create New Study
    with st.expander("✨ Create New Study"):
        with st.form("new_study_form"):
            new_study_name = st.text_input("Study Name", placeholder="e.g. cardiac_trial_v1")
            create_submitted = st.form_submit_button("Initialize Table")
            
            if create_submitted and new_study_name:
                safe_name = clean_identifier(new_study_name)
                try:
                    # Create table with standard research defaults
                    with conn.session as s:
                        s.execute(text(f"""
                            CREATE TABLE {safe_name} (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                mrn VARCHAR(50)
                            );
                        """))
                        s.commit()
                    st.toast(f"Study '{safe_name}' created!", icon="🎉")
                    st.rerun()
                except Exception as e:
                    st.error(f"Creation failed: {e}")

# --- Main App Logic ---

if not selected_study:
    st.info("👈 Please select or create a study in the sidebar to begin.")
    st.stop()

# --- 4. Dashboard Metrics ---
st.title(f"📊 {selected_study.replace('_', ' ').title()}")

# Fetch Data
try:
    df = conn.query(f"SELECT * FROM {selected_study} ORDER BY id DESC", ttl=0)
    
    # Metrics
    col_m1, col_m2, col_m3 = st.columns(3)
    col_m1.metric("Total Entries", len(df))
    
    last_active = df['created_at'].iloc[0] if not df.empty and 'created_at' in df.columns else "No Data"
    if isinstance(last_active, pd.Timestamp):
        last_active = last_active.strftime('%d %b %H:%M')
    col_m2.metric("Last Update", last_active)
    
    col_m3.metric("Schema Columns", len(df.columns))

except Exception as e:
    st.warning("Could not load metrics.")
    df = pd.DataFrame()

# --- 5. Tabs: Entry, View, Settings ---
tab_entry, tab_view, tab_settings = st.tabs(["📝 Smart Entry", "👀 Data Grid", "⚙️ Schema Settings"])

# === TAB 1: SMART DATA ENTRY ===
with tab_entry:
    # Auto-Form Generator
    try:
        schema_df = conn.query(f"SHOW COLUMNS FROM {selected_study}", ttl=0)
        
        with st.form("auto_entry_form"):
            st.subheader("Add Patient Record")
            
            form_inputs = {}
            
            # Responsive Grid for inputs
            cols = st.columns(2)
            col_index = 0
            
            for _, row in schema_df.iterrows():
                col_name = row['Field']
                col_type = row['Type'].lower()
                
                # Skip System Columns
                if col_name in ['id', 'created_at']:
                    continue
                
                # Determine Widget Type based on SQL Type
                with cols[col_index % 2]:
                    label = col_name.replace('_', ' ').title()
                    
                    if any(t in col_type for t in ['int', 'float', 'double', 'decimal']):
                        step = 1 if 'int' in col_type else 0.1
                        form_inputs[col_name] = st.number_input(label, step=step, key=f"in_{col_name}")
                    
                    elif 'date' in col_type:
                        form_inputs[col_name] = st.date_input(label, value=date.today(), key=f"in_{col_name}")
                    
                    elif 'text' in col_type: # Long text
                        form_inputs[col_name] = st.text_area(label, key=f"in_{col_name}")
                        
                    else: # Varchar/String
                        form_inputs[col_name] = st.text_input(label, key=f"in_{col_name}")
                
                col_index += 1

            st.markdown("---")
            submitted = st.form_submit_button("Save Record", use_container_width=True)
            
            if submitted:
                try:
                    # Construct Dynamic SQL
                    columns_str = ", ".join(form_inputs.keys())
                    values_placeholder = ", ".join([f":{k}" for k in form_inputs.keys()])
                    
                    sql = f"INSERT INTO {selected_study} ({columns_str}) VALUES ({values_placeholder})"
                    
                    with conn.session as s:
                        s.execute(text(sql), form_inputs)
                        s.commit()
                    
                    st.success("Entry saved successfully!")
                    st.rerun()
                except Exception as e:
                    st.error(f"Error saving: {e}")

    except Exception as e:
        st.error(f"Could not analyze schema: {e}")

# === TAB 2: DATA GRID ===
with tab_view:
    st.dataframe(
        df, 
        use_container_width=True,
        column_config={
            "created_at": st.column_config.DatetimeColumn(format="D MMM YYYY, h:mm a")
        }
    )

# === TAB 3: SCHEMA SETTINGS ("God Mode") ===
with tab_settings:
    st.info("💡 Add new columns here. Changes affect the database immediately.")
    
    with st.expander("➕ Add Variable (Column)", expanded=True):
        col_add1, col_add2, col_add3 = st.columns([2, 2, 1])
        
        new_col_name = col_add1.text_input("Variable Name", placeholder="e.g. blood_pressure")
        new_col_type = col_add2.selectbox("Data Type", [
            "Text (Short)", 
            "Text (Long)", 
            "Number (Integer)", 
            "Number (Decimal)", 
            "Date"
        ])
        
        # Map friendly names to SQL types
        type_mapping = {
            "Text (Short)": "VARCHAR(255)",
            "Text (Long)": "TEXT",
            "Number (Integer)": "INT",
            "Number (Decimal)": "FLOAT",
            "Date": "DATE"
        }
        
        if col_add3.button("Add Field"):
            if new_col_name:
                safe_col = clean_identifier(new_col_name)
                sql_type = type_mapping[new_col_type]
                
                try:
                    with conn.session as s:
                        s.execute(text(f"ALTER TABLE {selected_study} ADD COLUMN {safe_col} {sql_type}"))
                        s.commit()
                    st.success(f"Added column '{safe_col}'")
                    st.rerun()
                except Exception as e:
                    st.error(f"Failed to modify schema: {e}")
            else:
                st.error("Please enter a name")
