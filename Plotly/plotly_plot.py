import pandas as pd
import plotly.graph_objects as go

# Load dataset and filter data
df = pd.read_csv("region_10-2.csv", low_memory=False)
df = df[df['attacktype1_txt'] != 'Unknown']

# Aggregate incidents per year and attack type
attack_counts = df.groupby(["iyear", "attacktype1_txt"]).size().unstack(fill_value=0)
attack_percent = attack_counts.div(attack_counts.sum(axis=1), axis=0) * 100

fig = go.Figure()

# Function to add traces
def add_traces(data, stackgroup, visibility):
    for col in data.columns:
        fig.add_trace(go.Scatter(
            x=data.index, 
            y=data[col], 
            name=col, 
            stackgroup=stackgroup, 
            visible=visibility, 
            mode="lines",  # Ensures it's a line chart
            line=dict(width=1)
        ))

# Add traces
add_traces(attack_counts, "stacked", True)
add_traces(attack_percent, "percent", False)

# Grouped version 
for col in attack_counts.columns:
    fig.add_trace(go.Scatter(
        x=attack_counts.index, 
        y=attack_counts[col], 
        name=col, 
        visible=False, 
        mode="lines",  
        fill="tozeroy",  # Ensures area is filled
        line=dict(width=2)  
    ))

# Dropdown menu settings
views = ["Stacked", "100% Stacked", "Grouped"]
visibility_masks = [
    [True] * len(attack_counts.columns) + [False] * len(attack_percent.columns) + [False] * len(attack_counts.columns),
    [False] * len(attack_counts.columns) + [True] * len(attack_percent.columns) + [False] * len(attack_counts.columns),
    [False] * len(attack_counts.columns) + [False] * len(attack_percent.columns) + [True] * len(attack_counts.columns)
]

fig.update_layout(
    title="Evolution of Attack Types Over Time",
    xaxis_title="Year",
    yaxis_title="Incident Count",
    legend_title="Attack Type",
    updatemenus=[{
        "buttons": [
            {"label": view, "method": "update", "args": [{"visible": visibility}]}
            for view, visibility in zip(views, visibility_masks)
        ],
        "direction": "down",
        "showactive": True,
        "x": 0.30,
        "xanchor": "left",
        "y": 1.15,
        "yanchor": "top",
    }]
)

fig.show()
