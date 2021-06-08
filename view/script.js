var d3 = require("d3"),
  jsdom = require("jsdom");

var document = jsdom.jsdom(),
  svg = d3.select(document.body).append("svg");

const root = tree(
  bilink(
    d3
      .hierarchy(data)
      .sort(
        (a, b) =>
          d3.ascending(a.height, b.height) ||
          d3.ascending(a.data.name, b.data.name)
      )
  )
);

const svg = d3
  .create("svg")
  .attr("viewBox", [-width / 2, -width / 2, width, width]);

const node = svg
  .append("g")
  .attr("font-family", "sans-serif")
  .attr("font-size", 10)
  .selectAll("g")
  .data(root.leaves())
  .join("g")
  .attr(
    "transform",
    (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
  )
  .append("text")
  .attr("dy", "0.31em")
  .attr("x", (d) => (d.x < Math.PI ? 6 : -6))
  .attr("text-anchor", (d) => (d.x < Math.PI ? "start" : "end"))
  .attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null))
  .text((d) => d.data.name)
  .call((text) =>
    text.append("title").text(
      (d) => `${id(d)}
    ${d.outgoing.length} outgoing
    ${d.incoming.length} incoming`
    )
  );

svg
  .append("g")
  .attr("fill", "none")
  .selectAll("path")
  .data(
    d3.transpose(
      root
        .leaves()
        .flatMap((leaf) => leaf.outgoing.map(path))
        .map((path) => Array.from(path.split(k)))
    )
  )
  .join("path")
  .style("mix-blend-mode", "darken")
  .attr("stroke", (d, i) => color(d3.easeQuad(i / ((1 << k) - 1))))
  .attr("d", (d) => d.join(""));

return svg.node();
