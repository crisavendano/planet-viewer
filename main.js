const SVG1 = d3.select("#vis-1").append("svg");
const SVG2 = d3.select("#vis-2").append("svg");
const PLANETAS = "https://gist.githubusercontent.com/Hernan4444/c3c1951d161fec6eea6cc70c9b06b597/raw/aa18adad0e830ba422446411691bd148131c6c2a/planetas.json"

const CATEGORIAS_POR_PLANETA = {
    'Mercury': "DemoranPoco", 'Venus': "DemoranPoco", 'Earth': "DemoranPoco",
    'Mars': "DemoranPoco", 'Jupiter': "DemoranPoco", 'Saturn': "DemoranMucho",
    'Uranus': "DemoranMucho", 'Neptune': "DemoranMucho", 'Pluto': "DemoranMucho"
}

const COLORES_POR_PLANETA = {
    'Mercury': "#FFD700", 'Venus': "#FF8C00", 'Earth': "#00FFFF",
    'Mars': "#B22222", 'Jupiter': "#DEB887", 'Saturn': "#FF7F50",
    'Uranus': "#6A5ACD", 'Neptune': "#0000CD", 'Pluto': "#FFF8DC"
} 

const WIDTH_VIS_1 = 1200;
const HEIGHT_VIS_1 = 800;
const WIDTH_VIS_2 = 1200;
const HEIGHT_VIS_2 = 1440;
const SUN_RADIUS = 60;
const MIN_DISTANCE_FROM_FIRST_PLANET_TO_SUN = 150;
const MIN_DISTANCE_FROM_RIGHTMOST_PLANET_TO_RIGHT = 50;
const MIN_PLANET_RADIUS = 10;
const MAX_PLANET_RADIUS = 50;
const MIN_SATELLITE_RADIUS = 5;
const MAX_SATELLITE_RADIUS = 15;
const SATELITES_PER_ROW = 5;
const SATELITES_PER_COLUMN = Math.floor(30 / SATELITES_PER_ROW);
const SATELLITE_HEAD_SPACING = (WIDTH_VIS_2) / SATELITES_PER_ROW;
const SATELLITE_NAME_SPACING_ABOVE_HEAD = 40;
const SATELLITE_TORAX_HEIGHT = 40;
const MIN_SATELLITE_HAND_DISTANCE = 30;
const MAX_SATELLITE_HAND_DISTANCE = 80;
const ARMS_WIDTH = 3;                      
const BACKGROUND_COLOR = "#0F0F0F";
const TRANSITION_TIME = 1000;
const TOOLTIP_HORIZONTAL_DISTANCE_TO_MOUSE = 15;
const TOOLTIP_VERTICAL_DISTANCE_TO_MOUSE = -28;
const ORBIT_FACTOR_Y = 2;
const PLANET_NAME_SPACING_X = 10;

SVG1.attr("width", WIDTH_VIS_1).attr("height", HEIGHT_VIS_1);
SVG2.attr("width", WIDTH_VIS_2).attr("height", HEIGHT_VIS_2);

// Sistema Solar

const sunData ={
    cx: 0,
    cy: HEIGHT_VIS_1/2,
    r: SUN_RADIUS,
    fill: "orange"
}
function createSun(){
    SVG1.append("circle")
   .attr("cx",  sunData.cx)
   .attr("cy", sunData.cy)
   .attr("r", sunData.r)
   .attr("fill", sunData.fill);
}
function createOrbits(svg, planetData, planetDistanceScale){
    return  svg.selectAll(".orbit")
    .data(planetData)
    .enter()
    .append("ellipse")
    .attr("cx", 0)
    .attr("cy", HEIGHT_VIS_1 / 2) 
    .attr("rx", d => planetDistanceScale(d.distance_from_sun))
    .attr("ry", d => planetDistanceScale(d.distance_from_sun)/ORBIT_FACTOR_Y)
    .attr("fill", "none")
    .attr("stroke", "grey")
    .attr("stroke-width", 1)
    .attr("class", d => d.planet);
}
function createPlanetTooltip(){   

    const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .attr("id", "planet-tooltip")
    .style("opacity", 0);
    return tooltip;
}
function createPlanets(svg, planetData, tooltip, planetDistanceScale, planetColorScale, planetDiameterScale) {
    const planets = createPlanetCircles(svg, planetData, planetDistanceScale, planetDiameterScale, planetColorScale);
    attachPlanetTooltip(planets, tooltip);
    attachPlanetClickHandler(planets, svg, planetDistanceScale, planetDiameterScale);
    return planets;
}
function attachPlanetTooltip(planets, tooltip) {
    planets.on("mouseover", function (event, d) {
        tooltip.transition()
            .style("opacity", .9);
        tooltip.html(`Nombre: ${d.planet}<br>
            Distancia al Sol: ${d.distance_from_sun} x 10^6 km<br>
            Diámetro: ${d.diameter} km<br>
            T° Media: ${d.mean_temperature} °C`);
    })
    .on("mousemove", function (event, d) {
        tooltip.style("left", (event.pageX + TOOLTIP_HORIZONTAL_DISTANCE_TO_MOUSE) + "px")
            .style("top", (event.pageY + TOOLTIP_VERTICAL_DISTANCE_TO_MOUSE) + "px");
    })
    .on("mouseout", function (d) {
        tooltip.transition()
            .style("opacity", 0);
    });
}
function attachPlanetClickHandler(planets, svg) {
    planets.on("click", function (event, clickedPlanet) {
        svg.selectAll(".planet").attr("stroke", "none");

        const categoria = CATEGORIAS_POR_PLANETA[clickedPlanet.planet];
        preprocesarSatelites(categoria, false);

        planets.filter(d => CATEGORIAS_POR_PLANETA[d.planet] === categoria)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("class", "planet");
    });
}
function createPlanetCircles(svg, planetData, planetDistanceScale, planetDiameterScale, planetColorScale) {
    const planetCircles = svg.selectAll(".planet")
        .data(planetData)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => {
            const [x, _] = calcularPosicionBonusRotacion(i, planetDistanceScale(d.distance_from_sun), planetDistanceScale(d.distance_from_sun), 0, HEIGHT_VIS_1 / 2);
            return x;
        })
        .attr("cy", (d, i) => {
            const [_, y] = calcularPosicionBonusRotacion(i, planetDistanceScale(d.distance_from_sun), planetDistanceScale(d.distance_from_sun) / ORBIT_FACTOR_Y, 0, HEIGHT_VIS_1 / 2);
            return y;
        })
        .attr("r", d => planetDiameterScale(d.diameter))
        .attr("fill", d => planetColorScale(d.mean_temperature))
        .attr("stroke", d => planetColorScale(d.mean_temperature))
        .attr("stroke-width", 1)
        .attr("class", d => d.planet);

    return planetCircles;
}
function createPlanetNames(svg, planetData, planetDistanceScale, planetDiameterScale){
    const planetNames = svg.selectAll(".planet-name")
        .data(planetData)
        .enter()
        .append("text")
        .attr("x", (d, i) => {
            const [x, _] = calcularPosicionBonusRotacion(i, planetDistanceScale(d.distance_from_sun), planetDistanceScale(d.distance_from_sun), 0, HEIGHT_VIS_1 / 2);
            return x + PLANET_NAME_SPACING_X;})
        .attr("y", (d, i) => {
            const [_, y] = calcularPosicionBonusRotacion(i, planetDistanceScale(d.distance_from_sun), planetDistanceScale(d.distance_from_sun) / ORBIT_FACTOR_Y, 0, HEIGHT_VIS_1 / 2);
            return y;
        })
        .attr("dx", d => planetDiameterScale(d.diameter))
        .attr("dy", 0)
        .attr("fill", "white")
        .attr("class", d => d.planet)
        .text(d => d.planet)
    return planetNames;
}
function createPlanetsWithOrbits() {
    d3.json(PLANETAS).then(data => {

        const planetDistanceScale = d3.scaleLog().domain(d3.extent(data, d => d.distance_from_sun)).range([MIN_DISTANCE_FROM_FIRST_PLANET_TO_SUN, WIDTH_VIS_1-MIN_DISTANCE_FROM_RIGHTMOST_PLANET_TO_RIGHT]);
        const planetColorScale = d3.scaleSequential(t=>d3.interpolateRdBu(1-t)).domain(d3.extent(data, d => d.mean_temperature));
        const planetDiameterScale = d3.scaleLinear().domain(d3.extent(data, d => d.diameter)).range([MIN_PLANET_RADIUS, MAX_PLANET_RADIUS]);

        const tooltip = createPlanetTooltip();
        const orbits = createOrbits(SVG1, data, planetDistanceScale);
        const planets = createPlanets(SVG1, data, tooltip, planetDistanceScale, planetColorScale, planetDiameterScale);
        const planetNames = createPlanetNames(SVG1, data, planetDistanceScale, planetDiameterScale);
    });
}
function crearSistemaSolar() {
 
    createSun();
    d3.json(PLANETAS).then(d => {
        createPlanetsWithOrbits();});

    d3.json(PLANETAS).then(d => {
        console.log(d.map(e => [e.planet, e.diameter, e.distance_from_sun, e.mean_temperature]))
    })
}

// Satélites

let satelliteX = (d,i) => (i % SATELITES_PER_ROW) * SATELLITE_HEAD_SPACING + SATELLITE_HEAD_SPACING / 2;
let satelliteY = (d,i) => Math.floor(i / SATELITES_PER_ROW) * SATELLITE_HEAD_SPACING + SATELLITE_HEAD_SPACING / 2;

function crearSatelites(dataset, categoria, filtrar_dataset, ordenar_dataset) {
    // 1. Actualizo nombre de un H4 para saber qué hacer con el dataset
    let texto = `Categoria: ${categoria} - Filtrar: ${filtrar_dataset} - Orden: ${ordenar_dataset}`
    d3.selectAll("#selected").text(texto)

    // 2. Nos quedamos con los satelites asociados a la categoría seleccionada
    console.log(categoria)
    let datos = dataset.filter(d => CATEGORIAS_POR_PLANETA[d.planet] == categoria)

    // 3. Filtrar, cuando corresponde, por magnitud
    // Completar aquí
    console.log(filtrar_dataset)
    if (filtrar_dataset) {
        datos = datos.filter(d => d.radius > 100)
    }

    // 4. Quedarnos con solo 30 satelites. No editar esta línea
    datos = datos.slice(0, 30);
    console.log(datos)

    // 5. Ordenar, según corresponda, los 30 satelites. Completar aquí
    if (ordenar_dataset == "albedo") {
        datos.sort((x,y) => d3.ascending(x.albedo, y.albedo));
    }
    else if (ordenar_dataset == "alfabético") {
        datos.sort((x,y) => d3.ascending(x.name, y.name));
    }

    // 6. Confeccionar la visualización
    createSatellites(SVG2, datos);
    
}
function createSatellites(svg, satelliteData){

    const satelliteRadiusScale = d3.scaleLinear().domain(d3.extent(satelliteData, d => d.radius)).range([MIN_SATELLITE_RADIUS, MAX_SATELLITE_RADIUS]);
    const satelliteHandDistanceScale = d3.scaleLinear().domain(d3.extent(satelliteData, d => d.albedo)).range([MIN_SATELLITE_HAND_DISTANCE, MAX_SATELLITE_HAND_DISTANCE]);

    createSatelliteTooltip();
    createSatelliteArms(svg, satelliteData, satelliteHandDistanceScale);
    createSatelliteTorax(svg, satelliteData);
    createSatelliteHeads(svg, satelliteData, satelliteRadiusScale);
    createSatelliteNames(svg, satelliteData);
    createSatelliteLeftHands(svg, satelliteData, satelliteHandDistanceScale);
    createSatelliteRightHands(svg, satelliteData, satelliteHandDistanceScale);

    svg.selectAll(".planet")
        .attr("stroke", function(d) {
            return d3.select(this).classed(category) ? "white" : "none";
        })
        .attr("stroke-width", function(d) {
            return d3.select(this).classed(category) ? 2 : 1;
        });
}
function createSatelliteHeads(svg, satelliteData, satelliteRadiusScale) {
    
    const satelliteHeadColorScale = d3.scaleLinear().domain(d3.extent(satelliteData, d => d.magnitude)).range(["white", "yellow"]);
    
    const heads = svg.selectAll(".satellite-head").data(satelliteData, d => d.name);

    heads.transition().duration(TRANSITION_TIME)
        .attr("cx", (d, i) => satelliteX(d, i))
        .attr("cy", (d, i) => satelliteY(d, i))
        .attr("r", (d,i) => satelliteRadiusScale(d.radius))
        .attr("fill", (d,i) => satelliteHeadColorScale(d.magnitude));

    heads.enter().append("circle")
        .attr("class", "satellite-head")
        .attr("cx", (d, i) => satelliteX(d, i))
        .attr("cy", (d, i) => satelliteY(d, i))
        .attr("r", (d, i) => satelliteRadiusScale(d.radius))
        .attr("fill", (d, i) => satelliteHeadColorScale(d.magnitude))
        .attr("id", (d, i) => d.name)
        .style("opacity", 0)  // Inicialmente, oculto
        .transition().duration(TRANSITION_TIME)
        .style("opacity", 1)
        .on("end", function() {
            attachSatelliteMouseOver(svg, d3.select(this), createSatelliteTooltip());});
    
    heads.exit().transition().duration(TRANSITION_TIME)
        .style("opacity", 0)  // Desvanecer antes de eliminar
        .remove();

    attachSatelliteMouseOver(svg, heads, createSatelliteTooltip());

    return heads;
}
function createSatelliteNames(svg, satelliteData){

    const names = svg.selectAll(".satellite-name").data(satelliteData, d => d.name);

    names.transition().duration(TRANSITION_TIME)
        .attr("class", "satellite-name")
        .attr("x", (d, i) => satelliteX(d,i))
        .attr("y", (d, i) => satelliteY(d,i) - SATELLITE_NAME_SPACING_ABOVE_HEAD)
        .attr("fill", (d,i) => COLORES_POR_PLANETA[d.planet])
        .attr("text-anchor", "middle") 
        .text(d => d.name)
        .attr("id", (d, i) => d.name);

    names.enter().append("text")
        .attr("class", "satellite-name")
        .attr("x", (d, i) => satelliteX(d,i))
        .attr("y", (d, i) => satelliteY(d,i) - SATELLITE_NAME_SPACING_ABOVE_HEAD)
        .attr("fill", (d,i) => COLORES_POR_PLANETA[d.planet])
        .attr("text-anchor", "middle")
        .text(d => d.name)
        .attr("id", (d, i) => d.name)
        .style("opacity", 0)
        .transition().duration(TRANSITION_TIME)
        .style("opacity", 1)
        .on("end", function() {
            attachSatelliteMouseOver(svg, d3.select(this), createSatelliteTooltip());});

    names.exit().transition().duration(TRANSITION_TIME)
        .style("opacity", 0)
        .remove();

    attachSatelliteMouseOver(svg, names, createSatelliteTooltip());

    return names
}
function createSatelliteTorax(svg, satelliteData){

    const satelliteTorax = svg.selectAll(".satellite-torax").data(satelliteData, d => d.name);

    satelliteTorax.transition().duration(TRANSITION_TIME)
        .attr("x", (d, i) => satelliteX(d,i) - MIN_SATELLITE_RADIUS / 2)
        .attr("y", (d, i) => satelliteY(d,i) + MIN_SATELLITE_RADIUS)
        .attr("width", MIN_SATELLITE_RADIUS)
        .attr("height", SATELLITE_TORAX_HEIGHT)
        .attr("fill", (d,i) => COLORES_POR_PLANETA[d.planet])
        .attr("class", "satellite-torax")
        .attr("id", (d, i) => d.name);

    satelliteTorax.enter().append("rect")
        .attr("x", (d, i) => satelliteX(d,i) - MIN_SATELLITE_RADIUS / 2)
        .attr("y", (d, i) => satelliteY(d,i) + MIN_SATELLITE_RADIUS)
        .attr("width", MIN_SATELLITE_RADIUS)
        .attr("height", SATELLITE_TORAX_HEIGHT)
        .attr("fill", (d,i) => COLORES_POR_PLANETA[d.planet])
        .attr("class", "satellite-torax")
        .attr("id", (d, i) => d.name)
        .style("opacity", 0)
        .transition().duration(TRANSITION_TIME)
        .style("opacity", 1)
        .on("end", function() {
            attachSatelliteMouseOver(svg, d3.select(this), createSatelliteTooltip());});

    satelliteTorax.exit().transition().duration(TRANSITION_TIME)
        .style("opacity", 0)
        .remove();

    attachSatelliteMouseOver(svg, satelliteTorax, createSatelliteTooltip());

    return satelliteTorax;
}
function createSatelliteLeftHands(svg, satelliteData, satelliteHandDistanceScale){
    
    const satelliteLeftHands = svg.selectAll(".satellite-left-hands").data(satelliteData, d => d.name);

    satelliteLeftHands.transition().duration(TRANSITION_TIME)
        .attr("cx", (d, i) => satelliteX(d,i) - satelliteHandDistanceScale(d.albedo))
        .attr("cy", (d, i) => satelliteY(d,i))
        .attr("r", MIN_SATELLITE_RADIUS)
        .attr("fill", (d,i) => COLORES_POR_PLANETA[d.planet])
        .attr("class", "satellite-left-hands")
        .attr("id", (d, i) => d.name);
    
    satelliteLeftHands.enter().append("circle")
        .attr("cx", (d, i) => satelliteX(d,i) - satelliteHandDistanceScale(d.albedo))
        .attr("cy", (d, i) => satelliteY(d,i))
        .attr("r", MIN_SATELLITE_RADIUS)
        .attr("fill", (d,i) => COLORES_POR_PLANETA[d.planet])
        .attr("class", "satellite-left-hands")
        .attr("id", (d, i) => d.name)
        .style("opacity", 0)
        .transition().duration(TRANSITION_TIME)
        .style("opacity", 1)
        .on("end", function() {
            attachSatelliteMouseOver(svg, d3.select(this), createSatelliteTooltip());});

    satelliteLeftHands.exit().transition().duration(TRANSITION_TIME)
        .style("opacity", 0)
        .remove();

    attachSatelliteMouseOver(svg, satelliteLeftHands, createSatelliteTooltip());

    return satelliteLeftHands;

}
function createSatelliteRightHands(svg, satelliteData, satelliteHandDistanceScale){
    
    const satelliteRightHands = svg.selectAll(".satellite-right-hands").data(satelliteData, d => d.name);

    satelliteRightHands.transition().duration(TRANSITION_TIME)
        .attr("cx", (d, i) => satelliteX(d,i) + satelliteHandDistanceScale(d.albedo))
        .attr("cy", (d, i) => satelliteY(d,i))
        .attr("r", MIN_SATELLITE_RADIUS)
        .attr("fill", (d,i) => COLORES_POR_PLANETA[d.planet])
        .attr("class", "satellite-right-hands")
        .attr("id", (d, i) => d.name);
    
    satelliteRightHands.enter().append("circle")
        .attr("cx", (d, i) => satelliteX(d,i) + satelliteHandDistanceScale(d.albedo))
        .attr("cy", (d, i) => satelliteY(d,i))
        .attr("r", MIN_SATELLITE_RADIUS)
        .attr("fill", (d,i) => COLORES_POR_PLANETA[d.planet])
        .attr("class", "satellite-right-hands")
        .attr("id", (d, i) => d.name)
        .style("opacity", 0)
        .transition().duration(TRANSITION_TIME)
        .style("opacity", 1)
        .on("end", function() {
            attachSatelliteMouseOver(svg, d3.select(this), createSatelliteTooltip());});

    satelliteRightHands.exit().transition().duration(TRANSITION_TIME)
        .style("opacity", 0)
        .remove();

    attachSatelliteMouseOver(svg, satelliteRightHands, createSatelliteTooltip());

    return satelliteRightHands;
}
function createSatelliteArms(svg, satelliteData, satelliteHandDistanceScale) {

    const satelliteArms = svg.selectAll(".satellite-arms").data(satelliteData, d => d.name);
    
    satelliteArms.transition().duration(TRANSITION_TIME)
        .attr("cx", (d, i) => satelliteX(d,i))
        .attr("cy", (d, i) => satelliteY(d,i))
        .attr("rx", (d, i) => satelliteHandDistanceScale(d.albedo))
        .attr("ry", SATELLITE_TORAX_HEIGHT/2)
        .attr("stroke", (d,i) => COLORES_POR_PLANETA[d.planet])
        .attr("stroke-width", ARMS_WIDTH)
        .attr("class", "satellite-arms")
        .attr("id", (d, i) => d.name);
    
    satelliteArms.enter().append("ellipse")
        .attr("cx", (d, i) => satelliteX(d,i))
        .attr("cy", (d, i) => satelliteY(d,i))
        .attr("rx", (d, i) => satelliteHandDistanceScale(d.albedo))
        .attr("ry", SATELLITE_TORAX_HEIGHT/2)
        .attr("stroke", (d,i) => COLORES_POR_PLANETA[d.planet])
        .attr("stroke-width", ARMS_WIDTH)
        .attr("class", "satellite-arms")
        .attr("id", (d, i) => d.name)
        .style("opacity", 0)
        .transition().duration(TRANSITION_TIME)
        .style("opacity", 1)
        .on("end", function() {
            attachSatelliteMouseOver(svg, d3.select(this), createSatelliteTooltip());});

    satelliteArms.exit().transition().duration(TRANSITION_TIME)
        .style("opacity", 0)
        .remove();


    const satelliteArmsTopHidingRectangles = svg.selectAll(".satellite-arms-top-hiding-rectangles").data(satelliteData, d => d.name);

    satelliteArmsTopHidingRectangles.transition().duration(TRANSITION_TIME)
        .attr("x", (d, i) => satelliteX(d, i) - satelliteHandDistanceScale(d.albedo))
        .attr("y", (d, i) => satelliteY(d, i) - SATELLITE_TORAX_HEIGHT / 2 - 2)
        .attr("width", d => satelliteHandDistanceScale(d.albedo) * 2)
        .attr("height", SATELLITE_TORAX_HEIGHT/2)
        .attr("fill", BACKGROUND_COLOR)
        .style("opacity", 1)
        .attr("class", "satellite-arms-top-hiding-rectangles")
        .attr("id", (d, i) => d.name);

    satelliteArmsTopHidingRectangles.enter().append("rect")
        .attr("x", (d, i) => satelliteX(d, i) - satelliteHandDistanceScale(d.albedo))
        .attr("y", (d, i) => satelliteY(d, i) - SATELLITE_TORAX_HEIGHT / 2 - 2)
        .attr("width", d => satelliteHandDistanceScale(d.albedo) * 2)
        .attr("height", SATELLITE_TORAX_HEIGHT/2)
        .attr("fill", BACKGROUND_COLOR)
        .attr("class", "satellite-arms-top-hiding-rectangles")
        .attr("id", (d, i) => d.name)
        .style("opacity", 0)
        .transition().duration(TRANSITION_TIME/2)
        .style("opacity", 1);

    satelliteArmsTopHidingRectangles.exit().transition().duration(TRANSITION_TIME)
        .style("opacity", 0)
        .remove();

    attachSatelliteMouseOver(svg, satelliteArms, createSatelliteTooltip());

    return satelliteArms;

}
function createSatelliteTooltip(){
    const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .attr("id", "satellite-tooltip")
    .style("opacity", 0);
    return tooltip;
}
function attachSatelliteMouseOver(svg,  satellitePart, tooltip) {

    satellitePart.on("mouseover", function (event, d) {
        tooltip.transition()
            .style("opacity", .9);
        tooltip.html(`Nombre: ${d.name}<br>
                    Planeta: ${d.planet}<br>
                    Magnitud: ${d.magnitude}<br>
                    Albedo: ${d.albedo}<br>
                    Radio: ${d.radius} km`);

        d3.selectAll(".satellite-head, .satellite-torax, .satellite-arms, .satellite-name, .satellite-left-hands, .satellite-right-hands")
            .style("opacity", 0.3);

        d3.selectAll(`#${d.name}`).style("opacity", 1);

        tooltip.transition()
            .style("opacity", .9);
        tooltip.html(`Nombre: ${d.name}<br>
                    Planeta: ${d.planet}<br>
                    Magnitud: ${d.magnitude}<br>
                    Albedo: ${d.albedo}<br>
                    Radio: ${d.radius} km`);
    })
    .on("mousemove", function (event, d) {
        tooltip.style("left", (event.pageX + TOOLTIP_HORIZONTAL_DISTANCE_TO_MOUSE) + "px")
            .style("top", (event.pageY + TOOLTIP_VERTICAL_DISTANCE_TO_MOUSE) + "px");
    })
    .on("mouseout", function (d) {
        tooltip.transition()
            .style("opacity", 0);

    d3.selectAll(".satellite-head, .satellite-torax, .satellite-arms, .satellite-name, .satellite-left-hands, .satellite-right-hands")
    .style("opacity", 1);
    });
}

crearSistemaSolar();