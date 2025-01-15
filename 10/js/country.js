const inlineSVGRefs = (element) => {
  const svgs = element.querySelectorAll("svg");
  svgs.forEach((svg) => {
    const use = svg.querySelector("use");
    if (use) {
      const href = use.getAttribute("href") || use.getAttribute("xlink:href");
      if (href) {
        const referenceElement = document.querySelector(href);
        if (referenceElement) {
          // Clone the referenced content
          const clonedContent = referenceElement.cloneNode(true);
          // Copy attributes from original SVG to maintain styling
          Array.from(svg.attributes).forEach((attr) => {
            if (attr.name !== "class") {
              // Preserve original classes
              clonedContent.setAttribute(attr.name, attr.value);
            }
          });
          // Copy classes
          clonedContent.classList.add(...svg.classList);
          // Replace the original SVG with the inlined version
          svg.parentNode.replaceChild(clonedContent, svg);
        }
      }
    }
  });
};

document.addEventListener("DOMContentLoaded", () =>{
  // Your code here
   clickifyPrint(document.getElementById("print"));
});


document.getElementById("print")
const clickifyPrint = (dom)  => {
dom.addEventListener("click", async (e) => {
  e.preventDefault();
  const element = document.getElementById("gridmeps");
  //      const originalTransform = element.style.transform;
  //      element.style.transform = 'none';
  inlineSVGRefs(element);
  htmlToImage
    .toPng(element, {
      width: 1600,
      height: 900,
      pixelRatio: 1, // Force 1:1 pixel ratio
      style: {
        transform: "none",
        // Force the element to render at the specified dimensions
        width: "1600px",
        height: "900px",
        display: "block",
        position: "fixed", // Prevents layout shifts
      },
      filter: (node) => {
        if (
          node.style?.display === "none" ||
          node.style?.visibility === "hidden" ||
          node.hidden
        ) {
          return false;
        }
        // Exclude images that fail to load
        if (node.tagName === "IMG") {
          const img = node;
          console.log(img);
          return img.complete && img.naturalWidth !== 0;
        }
        return true; // Include all other nodes
      },
    })
    .then(function (dataUrl) {
      const element = document.getElementById("preview");
      element.src = dataUrl;

      const link = document.createElement("a");
      link.download = "vote.png";
      link.href = dataUrl;
      link.click();
      //        element.style.transform = originalTransform;
    });
});
};

const groupOrder = [
  "The Left",
  "Greens/EFA",
  "S&D",
  "Renew",
  "EPP",
  "ECR",
  "Patriots",
  "ESN",
  "NA",
];
let country = urlParam("country");
voteid = urlParam("v");
const aliasPosition = {
  attended: "present at the plenary, but didn't vote",
  "no show": "not present at the plenary",
};
let parties = [];
var percentagecolor = null;
const isMobile = window.matchMedia("screen and (max-width: 768px)").matches;

isMobile &&
  document
    .querySelectorAll("table")
    .forEach((d) => d.classList.add("table-sm"));

download(voteid, draw);

const getParty = (name, country) => {
  const party = parties.find((d) => d.party === name && d.country === country);
  return party;
};

async function draw() {
  parties = await dl_parties();
  d3.select(".navbar-toggler").on("click", function () {
    d3.select("#navbarHeader").classed(
      "show",
      d3.select("#navbarHeader").classed("show"),
    );
  });
  d3.select("h2").html(config.name == "CHANGE ME" ? "" : config.name);
  d3.select(".navbar .rapporteur").html(config.rapporteur);
  d3.select(".navbar .date").html(dateFormat(config.date));
  d3.select(".navbar .report").html(
    config.url && config.ref
      ? "<a class='btn btn-primary' href='" +
          config.url +
          "'>" +
          config.ref +
          "</a>"
      : config.ref,
  );
  d3.select(".navbar .app").attr(
    "href",
    "presentation/demo.html?v=" + config.id,
  );
  d3.select(".navbar .graph").attr("href", "graph.html?v=" + config.id);
  d3.select(".navbar .edit").attr("href", "edit.html?v=" + config.id);
  d3.select("h3").html(
    [config.name, config.title, config.description].join("<br>"),
  );
  d3.select("input.title")
    .property(
      "value",
      [config.name, config.title, config.description].join(" "),
    )
    .on("input", function () {
      d3.select("h3").html(d3.select(this).property("value"));
    });
  var percentColors = [
    "#e3e3e3",
    "#27ae60",
    "#C8E6C9",
    "#d3a751",
    "#ffcdd2",
    "#d35400",
  ];
  if (config.goal && config.goal == "against") {
    results[1] = results[0];
    results[0] = config.goal;
    d3.select("#icon-against path").attr("fill", "#27ae60");
    d3.select("#icon-for path").attr("fill", "#c0392b");
    percentColors = [
      "#e3e3e3",
      "#d35400",
      "#ffcdd2",
      "#d3a751",
      "#C8E6C9",
      "#27ae60",
    ];
  }

  percentagecolor = d3
    .scaleLinear()
    .domain([-1, 0, 49, 50, 51, 100])
    .range(percentColors)
    .interpolate(d3.interpolateHcl);

  d3.select(".nbmep .total").html("/" + config.nb);
  if (config.goal) {
    d3.select(".goal").classed("d-none", false);
    d3.select(".goal .badge").html(iconify(config.goal));
  }

  //    graphs.date=drawDate('#date div.graph');
  //    graphs.report=drawReport('#report div.graph');
  graphs.country = drawCountry("#country div.graph");
  //    graphs.party=drawParty('#voidparty div.graph');
  guessPartyLine("partyline");

  graphs.eugroup = drawBarVotes("#eugroup div.graph", function (d) {
    return d.eugroup;
  });
  guessLine("groupline", graphs.eugroup.group());
  graphs.eugroup.relative = false;
  graphs.party = drawBarVotes("#party div.graph", (d) => {
    return d.party;
    //return [d.country, d.party];
  });

  //graphs.party.xAxis().tickFormat(function(d) { return d[1]; });

  graphs.party.elasticX(true).title(function (d) {
    if (this.layer == 0) return "";
    return (
      d.key[1] +
      " voting '" +
      this.layer +
      "': " +
      d.value[this.layer].count +
      " (" +
      formatPercent(d.value[this.layer].count / d.value.nb.count) +
      ")"
    );
  });
  //      .keyAccessor(function(d){return d.key[1]})
  graphs.party.relative = false;

  graphs.party.margins({
    top: 5,
    right: 10,
    bottom: 5,
    left: 5,
  });

  //    graphs.group=drawGroup('#eugroup div.graph');
  drawNumbers(graphs);
  graphs.result = drawResult("#result .graph");
  graphs.search = drawSearch("form#search .graph");
  var filter = urlParam("q");
  if (filter) {
    graphs.search.on("pretransition", function () {
      graphs.search.on("pretransition", null);
      d3.select(" .dc-text-filter-input")
        .attr("value", filter)
        .dispatch("input");
    });
  }
  if (urlParam("country")) {
    d3.select("#party").classed("d-none", false);
  }

  ["eugroup", "country"].forEach(function (d) {
    graphs[d].on("filtered", function (graph) {
      var f = graph.filters().join("|");
      urlParam(d, f);
      d3.select("#party").classed("d-none", false);
    });
    filter = urlParam(d);
    if (filter) {
      (function (filter) {
        graphs[d].on("pretransition.url", function () {
          graphs[d].on("pretransition.url", null);
          graphs[d].filter([filter]);
        });
      })(filter.split("|"));
    }
  });
  graphs.grid = drawGrid("#gridmeps .graph");
  dc.renderAll();

  //             graphs.table = drawTable("table.table");
}

function remove_empty_bins(source_group, cap) {
  return {
    all: function () {
      source_group.top(Infinity);
      var g = source_group.all().filter(function (d) {
        return d.value.nb.count !== 0;
      });
      return g.slice(0, cap);
    },
  };
}

function guessPartyLine(store) {
  var dim = ndx.dimension(function (d) {
    return d.party;
  });

  var reducer = reductio();
  reducer.value("nb").count(true);
  results.forEach(function (r) {
    reducer
      .value(r)
      .count(true)
      .filter(function (d) {
        return d.vote == r;
      });
  });

  var group = dim.group();
  reducer(group);
  guessLine(store, group);
  ndx.all().forEach(function (mep) {
    var key = function (d) {
      return d.party;
    };
    if (["for", "against", "abstention"].indexOf(mep.vote) == -1) return false; // you aren't a rebel when you are a noshow ;P
    if (!config[store][key(mep)]) {
      mep.rebel = null; // we couldn't guess the party line
      return;
    }
    if (config[store][key(mep)] !== mep.vote) {
      mep.rebel = true;
    }
  });
  dim.dispose();
}

function drawParty(dom) {
  var eu_groups = {
    "GUE/NGL": "#800c00",
    "S&D": "#c21200",
    "Verts/ALE": "#05a61e",
    "Greens/EFA": "#05a61e",
    ALDE: "#ffc200",
    EFDD: "#5eced6",
    PPE: "#0a3e63",
    EPP: "#0a3e63",
    ECR: "#3086c2",
    "NA/NI": "#cccccc",
    "NA,NI": "#cccccc",
    ENF: "#A1480D",
    Array: "pink",
  };

  var graph = dc.sunburstChart(dom).innerRadius(10); //.radius(70);
  var dim = ndx.dimension(function (d) {
    return [d.eugroup, d.party];
  });
  var reducer = reductio();
  var res = results.slice();
  reducer.value("nb").count(true);
  res.forEach(function (r) {
    reducer
      .value(r)
      .count(true)
      .filter(function (d) {
        return d.vote == r;
      });
  });

  var group = dim.group();
  reducer(group);
  //var group = dim.group().reduceSum(function(d) {return 1;});
  graph
    .width(0)
    .height(0)
    .colorCalculator(function (d, i) {
      return eu_groups[d.data.path[0]];
    })
    .valueAccessor(function (d) {
      return d.value.nb.count;
    })
    .dimension(dim)
    .group(group)
    //        .externalLabels(-26)
    .minAngleForLabel(0.4)
    .on("preRender", function () {
      guessLine("partyline", group, function (d) {
        return d.key[1];
      });
    })
    .ordering(function (d) {
      return 0 + groups.indexOf(d.key[0]);
    });
  //        .legend(dc.legend().horizontal(true).autoItemWidth(true).y(200));
  return graph;
}

function drawGroup(dom) {
  var graph = dc.pieChart(dom).innerRadius(20); //.radius(70);
  var reducer = reductio();
  var dim = ndx.dimension(function (d) {
    return d.eugroup || "?";
  });

  var tip = d3
    .tip()
    .attr("class", "d3-tip wide-tip")
    .offset([-10, 0])
    .html(function (d) {
      var t =
        "<h3 class='d-flex flex-row justify-content-between' ><span>" +
          aliasPosition[d.data.key] ||
        d.data.key +
          "</span><span class='d-inline-flex p-2 badge badge-primary ml-2'>" +
          d.data.value.count +
          "</span></h3>";
      results.forEach(function (r) {
        if (d.data.value[r].count > 0) {
          t +=
            "<div class='d-flex flex-row justify-content-between'><div class='p-2 bd-highlight mr-auto w-50'>" +
            (aliasPosition[r] || r) +
            "</div><div class='p-1 w-25'>" +
            d.data.value[r].count +
            "</div><div class='p-1 w-25'>" +
            formatPercent(d.data.value[r].count / d.data.value.count) +
            "</div></div>";
        }
      });
      return t + "";
    });

  results.forEach(function (r) {
    reducer
      .value(r)
      .count(true)
      .filter(function (d) {
        return d.vote == r;
      });
  });
  //reducer.value("nb").count(true);
  reducer.count(true);

  var group = dim.group();
  reducer(group);
  //    var group = dim.group().reduceSum(function(d) {return 1;});
  graph
    .width(0)
    .height(0)
    .ordering(function (d) {
      return 0 + groups.indexOf(d.key);
    })
    .colorAccessor(function (d) {
      var sum = d.value.for.count + d.value.against.count;
      return (100 * d.value.against.count) / sum;
    })
    .label((d) => {
      return labelPosition[d.key] || d.key + " : " + d.value + " meps";
    })
    .colors(function (d) {
      return percentagecolor(d);
    })
    .valueAccessor(function (d) {
      return d.value.count;
    })
    .dimension(dim)
    .group(group)
    .externalLabels(-26)
    .minAngleForLabel(0.2)
    .on("renderlet.summary", function () {
      guessLine("groupline", group);
    });

  graph.on("pretransition", function (chart) {
    graph
      .selectAll(".pie-slice")
      .call(tip)
      .on("mouseover.tip", tip.show)
      .on("mouseout.tip", tip.hide);
  });

  //        .legend(dc.legend().horizontal(true).autoItemWidth(true).y(200));
  return graph;
}

// try to guess what was the party/eu group line
function guessLine(store, group, key) {
  key =
    key ||
    function (d) {
      return d.key;
    };
  if (config[store]) return; //already set
  config[store] = {};
  group.all().forEach(function (d) {
    var whip = 2 / 3;
    config[store][key(d)] = null; //free vote, no instruction
    ["for", "against", "abstention"].forEach(function (v) {
      var sum =
        d.value.for.count + d.value.against.count + d.value.abstention.count;
      if (d.value[v].count / sum > whip) config[store][key(d)] = v;
    });
  });
}

function isRebel(store, mep, key) {
  key =
    key ||
    function (d) {
      return d.eugroup;
    };
  if (["for", "against", "abstention"].indexOf(mep.vote) == -1) return false; // you aren't a rebel when you are a noshow ;)
  return store[key(mep)] && store[key(mep)] !== mep.vote;
}
function drawResult(dom) {
  var graph = dc.pieChart(dom).innerRadius(40); //.radius(radius);
  var dim = ndx.dimension(function (d) {
    return d.vote || "?";
  });
  var group = dim.group().reduceSum(function (d) {
    return 1;
  });

  graph
    .width(0)
    .height(0)
    .ordering(function (d) {
      return results.indexOf(d.key) >= 0 ? results.indexOf(d.key) : 1984;
    })
    .title((d) => (aliasPosition[d.key] || d.key) + ": " + d.value + " meps")
    .colors(resultscolor)
    /*      .colorCalculator(function(d, i) {
                          return eu_groups[d.key];
                          //return color(d.value.score/d.value.count);
                        })
                      */
    .on("filtered", function (c) {
      var mode = graphs.result.filters().length == 1 ? "absolute" : "relative";
      d3.select("#country .btn-" + mode).dispatch("click");
    })
    .dimension(dim)
    .group(group)
    .externalLabels(-26)
    //          .minAngleForLabel(0.2);
    .renderLabel(false);

  //        .legend(dc.legend().horizontal(true).autoItemWidth(true).y(200));
  graph.on("pretransition", function (chart) {
    const arc = d3
      .arc()
      .innerRadius(chart.innerRadius())
      .outerRadius(chart.width() / 2);

    chart.selectAll(".pie-slice").each(function (d, i) {
      const minAngle = d.endAngle - d.startAngle;

      const [x, y] = arc.centroid(d);
      d3.select(this).select("use").remove();

      if (minAngle < 0.2) return;

      d3.select(this)
        .append("use")
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", x - 10) // Adjust to centre the icon
        .attr("y", y - 10)
        .attr("href", `#icon-${d.data.key}`);
    });
    /*            .call(tip)
                              .on("mouseover.tip", tip.show)
                              .on("mouseout.tip", tip.hide);
                  */
  });
  return graph;
}

function drawBarVotes(dom, dimension) {
  //var dim = ndx.dimension(function(d) {return d[dimension]});
  //const width = isMobile ? window.screen.width - 40 : 220;
  const width = 0;
  var dim = ndx.dimension(dimension);
  var reducer = reductio();
  reducer.value("nb").count(true);
  results.forEach(function (r) {
    reducer
      .value(r)
      .count(true)
      .filter(function (d) {
        return d.vote == r;
      });
  });

  var group = dim.group();
  reducer(group);

  var graph = dc.barChart(dom);
  graph.fixedSize = true;
  graph.relative = true;

  function getValue(result) {
    if (graph.relative)
      return function (d) {
        return (d.value[result].count / d.value.nb.count) * 100;
      };
    return function (d) {
      return d.value[result].count;
    };
  }
  graph
    .width(width)
    .height(width)
    .outerPadding(0)
    .gap(1)
    .margins({
      top: 5,
      right: 10,
      bottom: 66,
      left: 5,
    })
    .ordering(function (d) {
      return -d.value.nb.count;
    })
    .x(d3.scaleBand())
    .xUnits(dc.units.ordinal)
    .colors(resultscolor)
    .brushOn(false)
    .title(function (d) {
      if (this.layer == 0) return "";
      return (
        d.key +
        " voting '" +
        (aliasPosition[this.layer] || this.layer) +
        "': " +
        d.value[this.layer].count +
        " (" +
        formatPercent(d.value[this.layer].count / d.value.nb.count) +
        ")"
      );
    })

    .elasticY(true)
    //        .elasticX(true)
    //.yAxisLabel("MEPs")
    .dimension(dim)
    .group(remove_empty_bins(group, 12), "", 0)
    //.group(group, "", 0)
    .on("renderlet", function (c) {
      rotateBarChartLabels();
      /*          if (!d3.select(dom +" .axis.x use").empty()) return;
                            d3.select(dom + " .axis.x").selectAll(".tick")
                              .append("use").attr( "href",function(d){
                              return '#flag-'+d}).attr("width",24).attr("height",16)
                              .attr("transform","translate(-10,2)");
                            */
    });

  graph.on("pretransition", function (chart) {
    chart.selectAll("rect.bar").on("click", function (event, d) {
      // Prevent default dc.js click behavior
      event.stopPropagation();

      // Get current filter
      const currentFilter = chart.filter();

      // If clicking the same bar, just remove filter
      if (currentFilter && currentFilter.includes(d.data.key)) {
        chart.filter(null);
      } else {
        // Otherwise, set only this bar as filter
        chart.filter(null); // Clear existing filters
        chart.filter(d.data.key);
      }

      // Redraw all charts
      dc.redrawAll();
    });
  });
  graph.xAxis().ticks(3);
  graph.yAxis().ticks(3);
  results.forEach(function (r) {
    graph.stack(remove_empty_bins(group, 12), r, function (d) {
      return getValue(r)(d);
    });
  });

  return graph;

  function rotateBarChartLabels() {
    d3.selectAll(dom + " .axis.x line").remove();
    d3.selectAll(dom + " .axis.x text")
      .text(function (d) {
        return d;
      })
      .style("text-anchor", "start")
      .attr("transform", function (d) {
        var left = -1 * graph.margins().bottom + 10;
        return "rotate(-90, -4, 9), translate(" + left + ",0) ";
      });
  }

  function toggleMode() {
    d3.selectAll("#country h5 button").on("click", function () {
      var b = d3.select(this);
      if (!b.classed("active")) return;
      graph.relative = b.classed("btn-relative");
      b.classed("active", false);
      d3.select(
        "#country .btn-" + (graph.relative ? "absolute" : "relative"),
      ).classed("active", true);
      graph.yAxisLabel((graph.relative ? "%" : "#") + "MEPs");
      graph.redraw();
    });
  }
}

const drawSelectCountry = (dom) => {
  const dim = ndx.dimension((d) => d.country);
  const group = dim.group().reduceSum((d) => 1);
};

function drawCountry(dom) {
  let heigth = 186;
  let width = 0;
  var dim = ndx.dimension(function (d) {
    return d.country;
  });
  var reducer = reductio();
  var res = results.slice();
  reducer.count(true);
  // reducer.value("nb").count(true);
  res.forEach(function (r) {
    reducer
      .value(r)
      .count(true)
      .filter(function (d) {
        return d.vote == r;
      });
  });

  var group = dim.group();
  reducer(group);

  var graph = dc.barChart(dom);
  graph.relative = true;

  if (isMobile) {
    heigth = window.screen.width - 80;
    //        width=900;
    document.getElementById("country").className += " rotated90";
  }

  function getValue(result) {
    if (graph.relative)
      return function (d) {
        return (d.value[result].count / d.value.count) * 100;
      };
    return function (d) {
      return d.value[result].count;
    };
  }

  graph
    .width(width)
    .height(heigth)
    .outerPadding(0)
    .gap(0)
    .margins({
      top: 0,
      right: 10,
      bottom: 20,
      left: 30,
    })
    .ordering(function (d) {
      return -d.value.count;
      if (config.goal && config.goal == "against")
        return -d.value.against.count / d.value.count;

      return -d.value.for.count / d.value.count;
    })
    .label(function (d) {
      return countries[d.country];
    })
    .x(d3.scaleBand())
    .xUnits(dc.units.ordinal)
    .colors(resultscolor)
    .brushOn(false)
    .title(function (d) {
      if (this.layer == 0) return "";
      return (
        countries[d.key] +
        " voting '" +
        (aliasPosition[this.layer] || this.layer) +
        "': " +
        d.value[this.layer].count +
        " (" +
        formatPercent(d.value[this.layer].count / d.value.count) +
        ")"
      );
    })

    .elasticY(true)
    .yAxisLabel("%MEPs")
    .dimension(dim)
    //        .group(group, "for", getValue("for")) bug: doesn't switch properly between absolute and relative
    .group(group, "", 0)
    .on("renderlet", function (c) {
      //!isMobile &&
      if (!d3.select("#country .axis.x .tick text.country-flag").empty())
        return;
      rotateBarChartLabels();
      d3.select("#country .axis.x")
        .selectAll(".tick")
        .append("text")
        //            .style("text-anchor", "start")
        .text((d) => flag(d))
        .attr("y", 20)
        .attr("x", 2)
        .attr("fill", "currentColor")
        .attr("class", "country-flag")
        .attr("width", 24)
        .attr("height", 16);
    });
  graph.xAxis().ticks(3);
  //      res.shift();
  res.forEach(function (r) {
    graph.stack(group, r, function (d) {
      return getValue(r)(d);
    });
  });

  toggleMode();

  graph.filterHandler((dimension, filters) => {
    // filters is an array of the currently selected values
    if (filters.length > 0) {
      // Keep only the most recently selected filter
      dimension.filter(filters[filters.length - 1]);
    } else {
      dimension.filter(null);
    }
    country = filters.slice(-1)[0];
    return filters.slice(-1); // Return only the last filter
  });
  return graph;

  function rotateBarChartLabels() {
    d3.selectAll(dom + " .axis.x line").remove();
    d3.selectAll(dom + " .axis.x text")
      .text(function (d) {
        return countries[d];
      })
      .style("text-anchor", "start")
      .attr("transform", function (d) {
        return "rotate(-90, -4, 9), translate(10,0) ";
      });
  }

  function toggleMode() {
    d3.selectAll("#country h5 button").on("click", function () {
      var b = d3.select(this);
      if (!b.classed("active")) return;
      graph.relative = b.classed("btn-relative");
      b.classed("active", false);
      d3.select(
        "#country .btn-" + (graph.relative ? "absolute" : "relative"),
      ).classed("active", true);
      graph.yAxisLabel((graph.relative ? "%" : "#") + "MEPs");
      graph.redraw();
    });
  }
}

function drawNumbers(graphs) {
  var dim = ndx.dimension(function (d) {
    return true;
  });

  var reducer = reductio();
  reducer.value("nb").count(true);
  //    reducer.value("woman").count(true).filter(function(d) {return d.Gender == "F;});

  reducer.value("nb").count(true);
  results.forEach(function (r) {
    reducer
      .value(r)
      .count(true)
      .filter(function (d) {
        return d.vote == r;
      });
  });

  var group = dim.group();
  reducer(group);

  graphs.total = dc
    .numberDisplay(".nbmep .nb")
    .group(group)
    .valueAccessor(function (d) {
      return d.value.nb.count;
    })
    .formatNumber(d3.format("d"))
    .on("renderlet.linked", function () {
      var d = group.top(1)[0].value.nb.count;
      d3.select(".nbmep button").classed("disabled", d == config.nb);
      d3.select(".nbmep .total").classed("d-none", d == config.nb);
    });
  d3.select(".resetall").on("click", function () {
    dc.filterAll();
    dc.renderAll();
  });

  graphs.total = dc
    .numberDisplay(".nbvoted .nb")
    .group(group)
    .valueAccessor(function (d) {
      return (
        d.value.for.count + d.value.against.count + d.value.abstention.count
      );
    })
    .formatNumber(d3.format("d"))
    .on("renderlet.linked", function () {
      var d = group.top(1)[0];
      d3.select(".result .nb").html(function () {
        if (!config.goal || d.value.for.count + d.value.against.count == 0)
          return "";
        if (d.value.nb.count != config.nb) {
          return "filtered ";
        }

        if (config.goal == "for") {
          return d.value.for.count > d.value.against.count ? "😊" : "😞";
        } else {
          return d.value.for.count < d.value.against.count ? "😊" : "😞";
        }
      });
      d3.select(".result .badge")
        .html(function () {
          var sum = d.value.for.count + d.value.against.count;
          if (sum == 0) return "";
          return (
            "" +
            formatPercent(
              Math.max(d.value.for.count, d.value.against.count) / sum,
            ) +
            "&nbsp;" +
            iconify(
              d.value.for.count > d.value.against.count ? "for" : "against",
            )
          );
        })
        .style("background-color", function () {
          var sum = d.value.for.count + d.value.against.count;
          return percentagecolor((100 * d.value.against.count) / sum);
        });
      d3.select(".nbvoted .badge").html(function () {
        var sum =
          d.value.for.count + d.value.against.count + d.value.abstention.count;
        if (sum == 0 || sum == d.value.nb.count) return "";
        return formatPercent(sum / d.value.nb.count);
      });
    });
}

function drawReport(dom) {
  var dim = ndx.dimension(function (d) {
    return d.epid;
  });

  var tip = d3
    .tip()
    .attr("class", "d3-tip")
    .offset([0, 10])
    .direction("e")
    .html(function (d) {
      return docs[d.key]
        ? "<h3>" +
            docs[d.key].rapporteur +
            "</h3>" +
            docs[d.key].title +
            ":" +
            d.value
        : d.value;
      //        return abbr(d.key) + "<br><b>" + d.value + " MEPs</b>&nbsp;<i>" + formatPercent(d.value/summary.total) +"</i>";
    });

  //var dim = ndx.dimension(function(d) {return d.report?d.report:"?";}, true);
  var dim = ndx.dimension(function (d) {
    return d.report ? d.report : "?";
  });
  var group = dim.group().reduceSum(function (d) {
    return 1;
  });

  var graph = dc
    .rowChart(dom)
    .width(0)
    .height(300)
    //      .rowsCap(18)
    //      .ordering(function(d) {  return -d.key      })
    .cap(10)
    .label(function (d) {
      return docs[d.key] ? docs[d.key].rapporteur : d.key;
    })
    .renderTitle(false)
    .margins({
      top: 0,
      right: 0,
      bottom: 20,
      left: 0,
    })
    //      .ordinalColors([committee_color])
    .gap(0)
    .elasticX(true)
    .dimension(dim)
    .group(group)
    .on("renderlet.top", function (c) {
      c.selectAll("g.row")
        .call(tip)
        .on("mouseover.tip", tip.show)
        .on("mouseout.tip", tip.hide);
    });
  graph.xAxis().ticks(3);

  return graph;
}

function drawSearch(dom) {
  var dim = ndx.dimension(function (d) {
    if (!d.firstname) console.log(d);
    return (
      d.firstname.toLowerCase() +
      " " +
      d.lastname.toLowerCase() +
      " " +
      d.party.toLowerCase()
    );
  });
  var filter = function (query) {
    //        query = _normalize(query);
    return function (d) {
      return d.indexOf(query.toLowerCase()) !== -1;
    };
  };
  var chart = dc
    .textFilterWidget(dom)
    .placeHolder("search by name")
    .filterFunctionFactory(filter)
    .dimension(dim)
    .on("renderlet", function () {
      d3.select(dom + " .dc-text-filter-input")
        .classed("form-control", true)
        .on("input.seturl", function () {
          urlParam("q", this.value);
        });
    });
  return chart;
}

function addGradients() {
  const container = document.querySelector("#gridmeps .graph");
  const items = container.querySelectorAll(".dc-grid-top");
  // Remove existing gradients
  const existingGradients = container.querySelectorAll(".cgradient");
  existingGradients.forEach((gradient) => gradient.remove());
  const scrollTop =
    document.documentElement.scrollTop || document.body.scrollTop;
  const scrollLeft =
    document.documentElement.scrollLeft || document.body.scrollLeft;

  items.forEach((item) => {
    const rects = Array.from(item.getClientRects());
    if (rects.length > 1) {
      rects.forEach((rect, index) => {
        const gradientContainer = document.createElement("div");
        gradientContainer.classList.add("cgradient");
        gradientContainer.style.position = "absolute";
        gradientContainer.style.left = `${rect.left + scrollLeft}px`;
        gradientContainer.style.top = `${rect.top + scrollTop}px`;
        gradientContainer.style.width = rect.width + "px";
        gradientContainer.style.height = rect.height + "px";
        item.appendChild(gradientContainer);

        if (index === 0) {
          // First rect: bottom gradient
          const bottomGradient = document.createElement("div");
          bottomGradient.classList.add("gradient", "bottom");
          gradientContainer.appendChild(bottomGradient);
        }
        if (index === rects.length - 1) {
          // Last rect: top gradient
          const topGradient = document.createElement("div");
          topGradient.classList.add("gradient", "top");
          console.log(gradientContainer);
          gradientContainer.appendChild(topGradient);
        }
      });
    }
  });
}

// Function to justify content vertically within columns
function justifyColumns() {
  function calculateColumnHeights() {
    let previousLeft = null;
    let column = -1;
    const columnHeights = [];
    const columnItems = [];
    const containerRect = container.getBoundingClientRect();
    const columnCount = parseFloat(getComputedStyle(container).columnCount);
    const columnWidth = container.offsetWidth / columnCount;
    boxes.forEach((item) => {
      const rects = Array.from(item.getClientRects());
      rects.forEach((rect) => {
        if (rect.left !== previousLeft) {
          column++;
          previousLeft = rect.left;
          columnItems[column] = [];
        }
        columnHeights[column] = (columnHeights[column] || 0) + rect.height;
      });
      columnItems[column].push(item);
    });

    return [columnHeights, columnItems];
  }
  const marginBottom = 10;
  const container = document.querySelector("#gridmeps .graph");
  const boxes = Array.from(container.children);
  console.log("aa", container, boxes);
  const columnCount = getComputedStyle(container).columnCount;
  const containerHeight = container.offsetHeight;
  // Wait for layout to settle
  setTimeout(() => {
    const [columnHeights, columns] = calculateColumnHeights();
    const maxColumnHeight = Math.max(...columnHeights);

    columns.forEach((col, i) => {
      const space = maxColumnHeight - columnHeights[i];
      console.log(space, col.length, space / col.length);
      col.forEach((box) => {
        if (space) box.style.marginBottom = `${space - 10}px`;
      });
    });
  }, 10);
}

function drawGrid(dom) {
  const _columns = d3
    .scaleLinear()
    .domain([15, 33, 76, 81, 96])
    .range([2, 3, 4, 5, 6]);
  const columns = (d) => Math.ceil(_columns(d));

  var dim = ndx.dimension(function (d) {
    return d.epid;
  });
  var template = d3.selectAll(".mep").html();
  var tpl = function (d) {
    var str = template;
    for (var key in d) {
      return str.replace(/({([^}]+)})/g, function (i) {
        var key = i.replace(/{/, "").replace(/}/, "");
        if (!d[key]) {
          return i;
        }

        return d[key];
      });
    }
    //      "firstname,lastname,country,eugroup,party,vote,id".split(",").forEach(function(f){});
  };
  var graph = dc
    .dataGrid(dom)
    .dimension(dim)
    .size(1000)
    .sortBy(function (d) {
      //return d.party;
      return d.lastname;
    })
    .html(tpl)
    .htmlSection((d) => {
      const [position, group, party] = d.key.split(",");
      const full = getParty(party, country);
      if (full) {
        return (
          "<div class='party'>" +
          (full.picture &&
            "<img src='https://pics.mepwatch.eu/parties/" +
              full.twitter?.toLowerCase() +
              ".jpg' title='" +
              full.party +
              "' />") +
          "<span class='text'>" +
          (full.acronym || full.party) +
          "</span>" +
          "<span title='" +
          group +
          "' class='img-rounded text-filter eugroup " +
          group.replace(/&|\/| |car/g, "-").toLowerCase() +
          "'>" +
          group +
          "</span></div>"
        );
      }
      return (
        party +
        "<span title='" +
        group +
        "' class='img-rounded text-filter eugroup " +
        group.replace(/&|\/| |car/g, "-").toLowerCase() +
        "'>" +
        group +
        "</span>"
      );
    })
    .section(function (d) {
      if (groupOrder.indexOf(d.eugroup) !== -1) {
        return [groupOrder.indexOf(d.eugroup), d.eugroup, d.party];
      }

      console.log(
        "no order for",
        d.eugroup,
        d.party,
        groupOrder.indexOf(d.eugroup),
        groupOrder,
      );
      return [999, d.eugroup, d.party];
    })
    .on("postRedraw", function (chart) {
      console.log("redraw");
      // Custom logic here
    })
    .on("renderlet.t", function (chart) {
      const items = graphs.grid.dimension().top(Infinity).length;

      const column = columns(items);
      const grid = d3.select(chart.anchor());

      d3.select(chart.anchor()).style("column-count", columns(items));
      [2, 3, 4, 5, 6, 7].forEach((i) =>
        grid.classed("column-" + i, i === column),
      );
      d3.select(chart.anchor())
        .selectAll(".dc-grid-top")
        .each(function () {
          const element = d3.select(this);
          //const height = element.node().getBoundingClientRect().height;
          const rects = Array.from(element.node().getClientRects());
          if (rects.length > 1 && rects[0].height < 80) {
            //    element.classed("avoid-break", true);
          }
        });
      //                  d3.selectAll(".dc-grid-item").attr("class", "grid mep");
      //                  d3.selectAll(".dc-grid-top").attr("class", "row");
    });
  console.log("render");
  setTimeout(() => {
    //                justifyColumns();
    console.log("render timeout");
    addGradients();
  }, 10);
  return graph;
}

function drawTable(dom) {
  var dim = ndx.dimension(function (d) {
    return d.lastname;
  });
  var graph = dc
    .dataTable(dom)
    .dimension(dim)
    .size(1000)
    .sortBy(function (d) {
      return results.indexOf(d.vote);
    })
    .order(d3.ascending)
    .showSections(false)
    .on("preRedraw", function () {
      graph.compact = graphs.total.data() > 400;
    })
    .columns([
      function (d) {
        return iconify(d.vote);
      },
      function (d) {
        var t = d.firstname + " " + d.lastname;
        if (!graph.compact)
          t =
            //                        "<img class='face' src='https://www.europarl.europa.eu/mepphoto/" +
            "<img class='face' src='./img/mep/" + d.epid + ".webp' />" + t;
        return t;
      },
      function (d) {
        return (
          '<span class="country-flag" title="' +
          d.country +
          '">' +
          iconify(d.country, "flag") +
          "</span>"
        );
      },
      function (d) {
        return (
          "<span title='" +
          d.eugroup +
          "' class='img-rounded text-filter eugroup " +
          d.eugroup.replace(/&|\/| |car/g, "-").toLowerCase() +
          "'>" +
          d.eugroup +
          "</span>"
        );
      },
      ,
      function (d) {
        if (d.prevGroup) {
          return (
            "<span title='was " +
            d.prevGroup +
            " at the vote, now " +
            d.eugroup +
            "' class='img-rounded text-filter eugroup " +
            d.prevGroup.replace(/&|\/|car/g, "-").toLowerCase() +
            "'>" +
            d.prevGroup +
            "</span>"
          );
        }
        if (d.rebel) return iconify("rebel");
      },
      function (d) {
        return d.party;
      },
    ]);

  //    drawPagination();
  sortable(graph);

  graph.on("pretransition", function (chart) {
    graph
      .selectAll("tr.dc-table-row")
      //      .call(tip)
      .on("click", tweet);
  });

  return graph;

  function tweet(d) {
    if (d.twitter) {
      var url =
        "https://twitter.com/intent/tweet?text=" +
        encodeURIComponent("Why did you vote that way? @" + d.twitter) +
        "&via=mepwatch";
      //        url = url.replace(/#/g, '%23');
      var win = window.open(url, "_blank");
    }
  }

  function sortable(chart) {
    var th = [
      {
        attr: function (d) {
          return results.indexOf(d.vote);
        },
      },
      //        ,{attr:"twitter"}
      { attr: "last_name" },
      { attr: "country" },
      { attr: "eugroup" },
      { attr: (d) => d.prevGroup || (d.rebel === true ? "r" : "z") },
      { attr: "party" },
    ];
    d3.selectAll("th")
      .data(th)
      .attr("class", function (d) {
        if (d.attr) return "sortable";
      })
      .attr("id", function (d, i) {
        return d.attr && typeof d.attr != "function" ? d.attr : "col_" + i;
      });

    d3.selectAll("th.sortable")
      .on("click", function (d) {
        var icon = d3.select(this).select("i.glyphicon");
        var up = icon.classed("glyphicon-arrow-up");
        d3.selectAll("th.sortable .glyphicon").attr(
          "class",
          "glyphicon glyphicon-sort",
        );
        if (!up) {
          icon.attr("class", "glyphicon glyphicon-arrow-up");
          chart.order(d3.ascending);
        } else {
          icon.attr("class", "glyphicon glyphicon-arrow-down");
          chart.order(d3.descending);
        }
        if (typeof d.attr == "function") {
          chart.sortBy(d.attr);
        } else {
          chart.sortBy(function (e) {
            return e[d.attr];
          });
        }
        chart.redraw();
      })
      .append("i")
      .attr("class", "glyphicon glyphicon-sort");

    d3.select("th#col_0 i").attr("class", "glyphicon glyphicon-arrow-down");
  }
}

function urlParam(name, value) {
  if (typeof value == "string") {
    var uri = window.location.href;
    value = encodeURIComponent(value);
    var re = new RegExp("([?&])" + name + "=.*?(&|#|$)", "i");
    if (uri.match(re)) {
      uri = uri.replace(re, "$1" + name + "=" + value + "$2");
    } else {
      var hash = "";
      if (uri.indexOf("#") !== -1) {
        hash = uri.replace(/.*#/, "#");
        uri = uri.replace(/#.*/, "");
      }
      var separator = uri.indexOf("?") !== -1 ? "&" : "?";
      uri = uri + separator + name + "=" + value + hash;
    }
    history.pushState({ q: value }, "search for " + value, uri);
    return uri;
  } else {
    var results = new RegExp("[?&]" + name + "=([^&#]*)").exec(
      window.location.href,
    );
    if (results == null) {
      return null;
    } else {
      return decodeURIComponent(results[1]) || 0;
    }
  }
}
