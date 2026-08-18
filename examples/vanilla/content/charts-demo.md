# Charts demo

`@basemark/charts`'s seven guided directives, each usable two ways: inline (a handful of numbers, no file needed) or from a hosted CSV/JSON file.

## Inline — no file needed

The shape an AI author reaches for when it has numbers on hand but nowhere to host them.

::bar-chart{labels="Apple,Banana,Cherry,Mango,Grape" values="42,28,15,35,20" title="Favorite fruit — votes"}

::line-chart{labels="Mon,Tue,Wed,Thu,Fri,Sat,Sun" values="18,19,17,21,24,26,23" title="Weekly temperature (°C)"}

::scatter-chart{xValues="1,2,3,4,5,6,7,8" yValues="52,55,61,64,70,75,78,85" title="Study hours vs. exam score"}

::pie-chart{labels="Chrome,Safari,Firefox,Edge,Other" values="65,19,7,5,4" title="Browser market share"}

::radar-chart{labels="Speed,Price,Quality,Support,Design" values="8,6,9,7,8" title="Product A vs. baseline"}

::funnel-chart{labels="Visitors,Signups,Trial,Paying" values="10000,3200,1400,420" title="Conversion funnel"}

::gauge-chart{value="87" title="Uptime %"}

## From a hosted file

CSV and JSON both work — format is inferred from the URL's extension.

::line-chart{data="/data/monthly-revenue.csv" x="month" y="revenue" title="Monthly revenue (CSV)"}

::scatter-chart{data="/data/height-weight.csv" x="height" y="weight" title="Height vs. weight (CSV)"}

::bar-chart{data="/data/population.json" x="country" y="population" title="Population by country, millions (JSON)"}

## Charts compose with layout components

Nothing chart-specific about this — any component nests inside `:::card`/`:::columns` the same way.

::::columns{cols="2"}
:::card{title="Q1"}
::bar-chart{labels="Jan,Feb,Mar" values="120,150,170" title="Q1"}
:::

:::card{title="Q2"}
::bar-chart{labels="Apr,May,Jun" values="140,200,220" title="Q2"}
:::
::::
