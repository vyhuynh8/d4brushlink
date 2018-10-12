var yearColors = {2000: '#8c8c8c', 2010: '#d86763'}, valueColors = ['#fcc9b5','#fa8873','#d44951','#843540'];

var histAtt = ['density', 'population', 'land'], hists = [];
var legendTitles = { 'density' : 'Urban density - 2010',
    'population' : 'Urban population - 2010',
    'land' : 'Urban land - 2010' }, legendLabel = { 'density' : ['< 5k', '5k-10k', '10k-15k', '> 15k'],
    'population' : ['< 2M', '2M-3M', '3M-4M', '> 4M'],
    'land' : ['< 0.4k', '0.4-0.6k', '0.6k-0.8k', '> 0.8k'] }


var svg = d3.select('svg'),
    svgWidth = +svg.attr('width'),
    svgHeight = +svg.attr('height');

var padding = {
        top: 20,
        right: 30,
        left: 20,
        bottom: 20
    };

var histogramW = (svgWidth - 275 - (padding.right * 3)) / 3,
    histogramH = svgHeight - padding.top - padding.bottom;

var rHeight = 380,
    rWidth = 280;

var barWidth = rWidth - (rWidth/3),
    barBand = rHeight / 23,
    barHeight = barBand * 0.4,
    cWidth = svgWidth/8 - 10,
    bHeight = svgHeight/2.5;


var barTip = d3.select("body").append("div")
    .attr("class", " bar tooltip")
    .style("opacity", 0);

var cityTip = d3.select("body").append("div")
    .attr("class", "dot tooltip")
    .style("opacity", 0);

var xScale = d3.scaleLinear();
var yScale = d3.scaleLinear()
    .range([histogramH, 0])
    .domain([0, 150]);
var colorScale = d3.scaleQuantize()
    .range(valueColors);

var colorDomain = { 'density' : 14000,
    'population' : 4005000,
    'land' : 900 };

var attribHash = { 'density' : ['density_2000', 'density_2010', 'density_growth'],
    'population' : ['pop_2000', 'pop_2010', 'pop_growth'],
    'land' : ['land_2000', 'land_2010', 'land_growth'] };

function Hist(attribute) {
    this.attribute = attribute;
}

Hist.prototype.update = function(g) {
    var hist = d3.select(g);
    var _this = this;
    createHistogram(hist, this['attribute']);
}

histAtt.forEach(function(attribute) {
    hists.push(new Hist(attribute));
});

var extentHash = {};

var brushHist;
var brushSelection = [0, svgWidth];
var brush = d3.brushX()
    .extent([[0, 0], [histogramW, (histogramH - 78)]])
    .on('start', brushStart)
    .on('brush', brushMove)
    .on('end', brushEnd);

function brushStart(hist) {
    if(!(brushHist == this)) {
        brush.move(d3.select(brushHist), null);
        xScale.range([0, histogramW])
            .domain(extentHash[hist['attribute']]);
        brushHist = this;
    }
}

function brushMove(hist) {
    var brushArea = d3.event.selection;

    if(brushArea) {
        var x0 = brushArea[0];
        var x1 = brushArea[1];

        brushSelection[0] = x0;
        brushSelection[1] = x1;

        svg.selectAll('.dot')
            .classed('hidden', function(d) {
                var growth = attribHash[hist['attribute']][2];
                return x0 > xScale(d[growth]) || xScale(d[growth]) > x1;
            });
    }
}

function brushEnd() {
    if(!d3.event.selection) {
        svg.selectAll('.hidden').classed('hidden', false);
        brushHist = undefined;
    }
}

function update(chartGraph, barData, barXscale, attribute) {

    var bars = chartGraph.selectAll('.bar')
        .data(barData, function(d){
            return d.key;
        });

    var barsEnter = bars.enter()
        .append('g')
        .attr('class', 'bar')
        .on('mouseover', function(d) {
            barTip.style("opacity", 1);
            var rounded_2000 = Math.round(d['value']['2000'] * 100) / 100;
            var rounded_2010 = Math.round(d['value']['2010'] * 100) / 100;
            barTip.html("<b>2000:</b> " +rounded_2000+ "<br/>"  + "<b>2010:</b> " +rounded_2010)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 50) + "px");
            svg.selectAll('.bar')
                .classed('hidden', function(v) {
                    return d['key'] != v['key'];
                })
                .style('font-weight', function(v) {
                    return d['key'] == v['key'] ? 'bold' : 'normal';
                })
            xScale.range([0, histogramW])
                .domain(extentHash[attribute]);
            svg.selectAll('.dot')
                .classed('hidden', function(v) {
                    if(brushHist != undefined) {
                        var x1 = brushSelection[0];
                        var x2 = brushSelection[1];
                        var growth = attribHash[attribute][2];
                        return d['key'] != v['country'] || x1 > xScale(v[growth]) || xScale(v[growth]) > x2;
                    } else {
                        return d['key'] != v['country'];
                    }
                });
        })
        .on('mouseout', function(d) {
            barTip.style("opacity", 0);
            svg.selectAll('.bar')
                .classed('hidden', function(v) {
                    return false;
                })
                .style('font-weight', 'normal');

            svg.selectAll('.dot')
                .classed('hidden', function(v) {
                    if(brushHist != undefined) {
                        var x1 = brushSelection[0];
                        var x2 = brushSelection[1];
                        var growth = attribHash[attribute][2];
                        return x1 > xScale(v[growth]) || xScale(v[growth]) > x2;
                    } else {
                        return false;
                    }
                });
        });

    bars.merge(barsEnter)
        .attr('transform', function(d,i){
            return 'translate('+[0, i * barBand+50]+')';
        });

    barsEnter.append('rect')
        .attr('height', barHeight)
        .attr('width', function(d){
            return barXscale(d.value["2010"]);
        })
        .attr('fill', yearColors["2010"])
        .attr('x', '10');

    barsEnter.append('rect')
        .attr('height', barHeight)
        .attr('width', function(d){
            return barXscale(d.value["2000"]);
        })
        .attr('y', '4')
        .attr('x', '10')
        .attr('fill', yearColors["2000"]);

    barsEnter.append('text')
        .attr('x', -78)
        .attr('dy', '0.6em')
        .attr('font-size','11px')
        .text(function(d){
            return d.key;
        });

    bars.exit().remove();


}
function createHistogram(parent, attribute) {
    selection = parent.append('g')
        .attr('class', 'histogram');

    var growth = attribHash[attribute][2];

    colorScale.domain([0, colorDomain[attribute]]);

    xScale.range([0, histogramW])
        .domain(extentHash[attribute]);

    var histogram = d3.histogram()
        .domain(xScale.domain())
        .thresholds(xScale.ticks(80))
        .value(function(d) {
            return d[growth];
        });
    var sorted = myData.sort(function(x, y) {
        return d3.descending(x[attribHash[attribute][1]], y[attribHash[attribute][0]]);
    });

    bins = histogram(sorted);

    var container = selection.selectAll('.bin')
        .data(bins);
    var containEnter = container.enter()
        .append('g')
        .attr('class', 'bin')
        .attr('transform', function(d) {
            return 'translate(' + [xScale(d.x0), -80] + ')';
        });

    var dots = containEnter.selectAll('.dot')
        .data(function(d) {
            return d.map(function(v) {
                return v;
            })
        });

    var dotEnter = dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', 2)
        .attr('cy', function(d, i) {
            return yScale(i);
        })
        .style('fill', function(d) {
            return colorScale(d[attribHash[attribute][1]]);
        })
        .on('mouseover', function(d) {
            cityTip.style('opacity', 1);
            cityTip.html("<b>" +d['city']+ ", " +d['country']+ '</b></br>' +
                attribHash[attribute][0]+ ": " +d[attribHash[attribute][0]]+ "</br>" +
                attribHash[attribute][1]+ ": " +d[attribHash[attribute][1]]+ "</br>" +
                "growth: " +d[growth])
                .style('left', (d3.event.pageX - 55) + 'px')
                .style('top', (d3.event.pageY - 85) + 'px');
        })
        .on('mouseout', function(d) {
            cityTip.style('opacity', 0);
        });

    var legend = selection.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(' +[1.5*cWidth, bHeight+195]+ ')');

    legend.append('text')
        .attr('class', 'legend title')
        .attr('transform', 'translate(' +[15 - 50, -15 * 4]+ ')')
        .text(legendTitles[attribute]);

    var legendRow = legend.selectAll('.row')
        .data(legendLabel[attribute])
        .enter()
        .append('g')
        .attr('class', 'legend row');

    legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('y', function(d, i) {
            return 15 * -i;
        })
        .style('fill', function(d, i) {
            return valueColors[i];
        })

    legendRow.append('text')
        .text(function(d) {
            return d;
        })
        .attr('x', 15 + 6)
        .attr('y', function(d, i) {
            return 12 + 15 * -i;
        })

}
// Dataset from http://nbremer.github.io/urbanization/
d3.csv('./data/asia_urbanization.csv',
    function(row){
        return {
            city: row.city,
            country: row.country,
            type_country: row.type_country,
            land_2000: +row.land_2000,
            land_2010: +row.land_2010,
            land_growth: +row.land_growth,
            pop_2000: +row.pop_2000,
            pop_2010: +row.pop_2010,
            pop_growth: +row.pop_growth,
            density_2000: +row.density_2000,
            density_2010: +row.density_2010,
            density_growth: +row.density_growth
        }
    },
    function(error, dataset){
        if(error) {
            console.error('Error while loading ./data/asia_urbanization.csv dataset.');
            console.error(error);
            return;
        }

        myData = dataset;

        histAtt.forEach(function(attribute, i) {
            extentHash[attribute] = d3.extent(dataset, function(d) {
                return d[attribHash[attribute][2]];
            });
        });

        var xScale_density = d3.scaleLinear()
            .domain([d3.min(dataset, function(d) { return d.density_growth; }), d3.max(dataset, function(d) {return d.density_growth; })])
            .range([0, (svgWidth - 275 - (padding.right * 3)) / 3]);

        var xScale_pop = d3.scaleLinear()
            .domain([d3.min(dataset, function(d) { return d.pop_growth; }), d3.max(dataset, function(d) {return d.pop_growth; })])
            .range([0, (svgWidth - 275 - (padding.right * 3)) / 3]);

        var xScale_land = d3.scaleLinear()
            .domain([d3.min(dataset, function(d) { return d.land_growth; }), d3.max(dataset, function(d) {return d.land_growth; })])
            .range([0, (svgWidth - 275 - (padding.right * 3)) / 3]);

        var yScale_hist = d3.scaleLinear()
            .domain([0, 150])
            .range([(svgHeight - padding.top - padding.bottom) - padding.top, 0]);

        var formatPercent = function(d) {
            return Math.round(d * 10000) / 100 + '%';
        }

        var histEnter = svg.selectAll('.hist')
            .data(hists)
            .enter()
            .append('g')
            .attr('class', 'hist')
            .attr('transform', function(d, i) {
                return 'translate(' + [250 + 400*i, 80] + ')';
            });
        histEnter.append('g')
            .attr('class', 'brush')
            .call(brush);


        histEnter.each(function(hist) {
            hist.update(this);
        });

        svg.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', 'translate(250,' + (histogramH + 2) + ')')
            .call(d3.axisBottom(xScale_density).ticks(8).tickFormat(formatPercent));

        var popX = 275 + histogramW + 20;
        svg.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', 'translate(' + popX + ',' + (histogramH + 2) + ')')
            .call(d3.axisBottom(xScale_pop).ticks(8).tickFormat(formatPercent));

        var landX = 275 + (histogramW *2) + (padding.right * 2);
        svg.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', 'translate(' + (landX + 10) + ',' + (histogramH + 2) + ')')
            .call(d3.axisBottom(xScale_land).ticks(5).tickFormat(formatPercent));

        svg.append('g')
            .attr('class', 'axis axis--y')
            .attr('transform', 'translate(250,'+ 20 + ')')
            .call(d3.axisLeft(yScale_hist).ticks(7));

        svg.append('g')
            .attr('class', 'axis axis--y')
            .attr('transform', 'translate(' + popX + ',' + 20 + ')')
            .call(d3.axisLeft(yScale_hist).ticks(7));

        svg.append('g')
            .attr('class', 'axis axis--y')
            .attr('transform', 'translate(' + (landX + 10) + ',' + 20 + ')')
            .call(d3.axisLeft(yScale_hist).ticks(7));

        svg.append('text')
            .attr('class', 'y axis-label')
            .attr('transform', 'translate(' + [225, histogramH] + ') rotate(270)')
            .text('Number of Cities');

        svg.append('text')
            .attr('class', 'y axis-label')
            .attr('transform', 'translate(' + [popX - 21, histogramH] + ') rotate(270)')
            .text('Number of Cities');

        svg.append('text')
            .attr('class', 'y axis-label')
            .attr('transform', 'translate(' + [landX - 21, histogramH] + ') rotate(270)')
            .text('Number of Cities');

        var densityBarD = d3.nest()
            .key(function(d) { return d.country; })
            .rollup(function(v) {return {
                "2000": d3.mean(v, function(d) {return d.density_2000; }),
                "2010": d3.mean(v, function(d) {return d.density_2010; })
            }; }).entries(dataset).sort(function(a, b) {
            return a.value["2010"] - b.value["2010"];
        }).reverse();

        var popBarD = d3.nest()
            .key(function(d) { return d.country; })
            .rollup(function(v) {return {
                "2000": d3.sum(v, function(d) {return d.pop_2000; }),
                "2010": d3.sum(v, function(d) {return d.pop_2010; })
            }; }).entries(dataset).sort(function(a, b) {
            return a.value["2010"] - b.value["2010"];
        }).reverse();

        var landData = d3.nest()
            .key(function(d) { return d.country; })
            .rollup(function(v) {return {
                "2000": d3.sum(v, function(d) {return d.land_2000; }),
                "2010": d3.sum(v, function(d) {return d.land_2010; })
            }; }).entries(dataset).sort(function(a, b) {
            return a.value["2010"] - b.value["2010"];
        }).reverse();

        svg.append('rect')
            .attr("x", 275 + 80)
            .attr("y", padding.top)
            .attr("width", rWidth)
            .attr("height", rHeight)
            .attr('stroke', 'grey')
            .attr('fill', 'white')
            .style('opacity', 0.9);

        svg.append('rect')
            .attr("x", popX + 80)
            .attr("y", padding.top)
            .attr("width", rWidth)
            .attr("height", rHeight)
            .attr('stroke', 'grey')
            .attr('fill', 'white')
            .style('opacity', 0.9);

        svg.append('rect')
            .attr("x", landX + 80)
            .attr("y", padding.top)
            .attr("width", rWidth)
            .attr("height", rHeight)
            .attr('stroke', 'grey')
            .attr('fill', 'white')
            .style('opacity', 0.9);


        var density_xScale_bar = d3.scaleLinear()
            .domain([0, d3.max(densityBarD, function(d) {return d.value["2010"]; })])
            .range([0, barWidth]);

        var pop_xScale_bar = d3.scaleLinear()
            .domain([0, d3.max(popBarD, function(d) {return d.value["2010"]; })])
            .range([0, barWidth]);

        var land_xScale_bar = d3.scaleLinear()
            .domain([0, d3.max(landData, function(d) {return d.value["2010"]; })])
            .range([0, barWidth]);

        var density_BarchartGraph = svg.append('g')
            .attr('transform', 'translate('+[275 + 160, padding.top]+')');
        var pop_BarchartGraph = svg.append('g')
            .attr('transform', 'translate(' + [popX + 160, padding.top] + ')');
        var land_BarchartGraph = svg.append('g')
            .attr('transform', 'translate(' + [landX + 160, padding.top] + ')');

        density_BarchartGraph.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', 'translate(10,'+ (rHeight - 28)+ ')')
            .call(d3.axisBottom(density_xScale_bar).ticks(6).tickFormat(d3.format('.0s')));

        pop_BarchartGraph.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', 'translate(10,'+ (rHeight - 28)+ ')')
            .call(d3.axisBottom(pop_xScale_bar).ticks(6).tickFormat(d3.format('.0s')));

        land_BarchartGraph.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', 'translate(10,'+ (rHeight - 28)+ ')')
            .call(d3.axisBottom(land_xScale_bar).ticks(6).tickFormat(d3.format('.0s')));

        update(density_BarchartGraph, densityBarD, density_xScale_bar, 'density');
        update(pop_BarchartGraph, popBarD, pop_xScale_bar, 'population');
        update(land_BarchartGraph, landData, land_xScale_bar, 'land');

        svg.append('text')
            .attr('font-size', '13px')
            .attr('x', 370)
            .attr('y', padding.top + 15)
            .attr('fill', 'black')
            .text('Avg. population density (in persons/sq. km)');

        svg.append('text')
            .attr('font-size', '13px')
            .attr('x', popX + 160)
            .attr('y', padding.top + 15)
            .attr('fill', 'black')
            .text('Urban population');

        svg.append('text')
            .attr('font-size', '13px')
            .attr('x', landX + 150)
            .attr('y', padding.top + 15)
            .attr('fill', 'black')
            .text('Urban land (in sq. km)');

    });








