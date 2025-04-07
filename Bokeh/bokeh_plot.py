import pandas as pd
from bokeh.plotting import figure, show
from bokeh.models import ColumnDataSource, HoverTool, Slider, CustomJS, CategoricalColorMapper, Div
from bokeh.layouts import row, column, Spacer
from bokeh.palettes import Category20
from bokeh.io import output_file

# Load dataset
file_path = "region_10-2.csv" 
df = pd.read_csv(file_path)

# Merge 'Unknown' and 'Other' categories into 'Other/Unknown'
df["targtype1_txt"] = df["targtype1_txt"].replace(["Unknown", "Other"], "Other/Unknown")

# Fill NaN values with 0
df.fillna({"nkill": 0, "nwound": 0}, inplace=True)
df["total_casualties"] = df["nkill"] + df["nwound"]

# Convert 'iyear' to string for filtering
df["iyear"] = df["iyear"].astype(str)
data_source = ColumnDataSource(df)

unique_targets = df["targtype1_txt"].unique().tolist()
color_mapper = CategoricalColorMapper(factors=unique_targets, palette=Category20[20])

p = figure(x_axis_label="Number Killed", y_axis_label="Number Wounded", tools="pan,wheel_zoom,box_zoom,reset", width=1100, height=560)

# Scatter plot with circles
p.scatter(x="nkill", y="nwound", source=data_source, size="total_casualties", color={"field": "targtype1_txt", "transform": color_mapper}, legend_field="targtype1_txt", fill_alpha=0.6)

# hover tool
hover = HoverTool(tooltips=[
    ("Target", "@targtype1_txt"),
    ("Killed", "@nkill"),
    ("Wounded", "@nwound"),
    ("Total Casualties", "@total_casualties"),
    ("Year", "@iyear")
])
p.add_tools(hover)

# Move legend to the side
p.legend.location = "top_right"
p.legend.orientation = "vertical"
p.legend.title = "Target Type"

# Slider for filtering by year
year_slider = Slider(start=int(df["iyear"].min()), end=int(df["iyear"].max()), value=int(df["iyear"].min()), step=1, title="Year")
year_slider.js_on_change("value", CustomJS(args=dict(source=data_source, original_data=df.to_dict("list")), code="""
    var year = cb_obj.value.toString();
    var data = source.data;
    var orig = original_data;
    
    var nkill = [], nwound = [], targtype1_txt = [], total_casualties = [], iyear = [];
    
    for (var i = 0; i < orig['iyear'].length; i++) {
        if (orig['iyear'][i] == year) {
            nkill.push(orig['nkill'][i]);
            nwound.push(orig['nwound'][i]);
            targtype1_txt.push(orig['targtype1_txt'][i]);
            total_casualties.push(orig['total_casualties'][i]);
            iyear.push(orig['iyear'][i]);
        }
    }
    
    data['nkill'] = nkill;
    data['nwound'] = nwound;
    data['targtype1_txt'] = targtype1_txt;
    data['total_casualties'] = total_casualties;
    data['iyear'] = iyear;
    
    source.change.emit();
"""))

# Define spacers for centering
spacer_left = Spacer(width=200)  # Adjust width for centering
spacer_right = Spacer(width=200)

# Center the plot using row layout
centered_plot = row(spacer_left, p, spacer_right)

# Center the header
heading = Div(text='<h1 style="text-align: center; width: 230%;">Target Types and Casualties Overview</h1>', width=1000, styles={"margin": "0 auto", "display": "block"})

# Center the slider using a row with spacers
centered_slider = row(Spacer(width=600), year_slider, Spacer(width=600))  # Adjust Spacer widths for centering

# Combine everything in a single centered layout
#output_file("bokeh_viz.html")
show(column(heading, centered_slider, centered_plot), notebook_handle=True)


