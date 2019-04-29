'use-strict';

(function() {

  var context = "";
  var regressionConstants = "";
  // wait until window loads to execute code
  window.onload = function() {
    let canvas = document.getElementById('myCanvas');
    context = canvas.getContext("2d");
    fetch("./data/admission_predict.json")
      .then(res => res.json()) // res is returned from the above fetch
      .then(data => makeScatterPlot(data)); // data is returned from last .then
  }

  // make a scater plot of the data with the given function
  function makeScatterPlot(data) {
    let axesLimits = findMinMax(data);

    const binCount  = 4;
    const { xMin, xMax } = axesLimits;
    const bins = [];
    const diff = (xMax - xMin) / binCount;
    for (let i = 0; i < 400; i++) {
        const x = data[i]["TOEFL Score"];
        let bin = Math.floor(((x - xMin) / diff)); // bin for given x value
        if (x === xMax) {
            bin -= 1;
        }
        if (!bins[bin]) {
            bins[bin] = []; // yes i know i don't actually need to store them, but i like the flexibility of it
        }
        bins[bin].push(x);
    }
    let max = 0;
    bins.forEach((bin) => {
        if (bin.length > max) {
            max = bin.length;
        }
    });
    drawAxesTicks(axesLimits, max);
    // top boundry === 75
    // bottom boundry === 450
    // left boundry === 130
    // right boundry === 400
    const width = (396 - 130) / binCount;
    const startY = 450;
    context.lineWidth = 2;
    context.fillStyle = 'pink';
    bins.forEach((bin, index) => {
        const height = (450 - 75) * (bin.length / max);
        context.beginPath();
        context.rect(130 + (width * index), startY - height, width, height);
        context.stroke();
        context.fill();
    });


    
    drawAxesLines(); // draw axes
  }

  // draw x and y axes
  function drawAxesLines() {
    context.lineWidth = 1;
    line(130, 50, 130, 450);
    line(130, 450, 450, 450);
  }

  // find the min and max for each axis
  // returns an object with x and y axes min/max
  function findMinMax(data) {
    let toeflScores = data.map((row) => parseInt(row["TOEFL Score"]));
    let admissionRates = data.map((row) => parseFloat(row["Chance of Admit"]));
    regressionConstants = linearRegression(toeflScores, admissionRates);

    // get x-axis min and max
    let xMax = Math.max.apply(Math, toeflScores);
    let xMin = Math.min.apply(Math, toeflScores);

    // round x-axis limits
    xMax = Math.round(xMax*10)/10;
    xMin = Math.round(xMin*10)/10;

    // get y-axis min and max
    let yMax = Math.max.apply(Math, admissionRates);
    let yMin = Math.min.apply(Math, admissionRates);

    // round y-axis limits to nearest 0.05
    yMax = Number((Math.ceil(yMax*20)/20).toFixed(2));
    yMin = Number((Math.ceil(yMin*20)/20).toFixed(2));

    // format axes limits and return it
    let allMaxsAndMins = {
      xMax : xMax,
      xMin : xMin,
      yMax : yMax,
      yMin : yMin
    }
    return allMaxsAndMins;

  }

  // draw the axes ticks on both axes
  function drawAxesTicks(axesLimits, maxBin) {
    context.font = "normal 10px Arial";
    // draw x-axis ticks
    let xMark = axesLimits.xMin; // start a counter with initial value xMin
    for (let x = 130; x < 400; x += 38) {
      // stop if counter is greater than x-axis max
      if (xMark > axesLimits.xMax) {
        break;
      }
      // draw the counter and label it
      line(x, 440, x, 460);
      context.fillText(xMark, x - 5, 470);
      // increment counter
      xMark += 4;
    }
    context.font = "bold 11px Arial";
    context.fillText('Count of TOEFL', 0, 300);

    context.font = "normal 10px Arial";
    for (let y = 75; y <= 450; y += 25) {
      line(120, y, 140, y);
      const text = (maxBin * ((375 - (y - 75)) / 375)).toFixed();
      context.fillText(text, 100, y + 5);
    }
    context.font = "bold 11px Arial";
    context.fillText('TOEFL Scores (bin)', 190, 490);
  }

  // plot a point at the given Canvas x and y coordinate
  function plotPoint(x, y) {
    hexString = 'FFC0E9'; // base color for gradient
    hexInt = parseInt(hexString, 16);
    context.beginPath();
    context.arc(x + 80, y, 3, 0, 2 * Math.PI, false); // made point area smaller
    context.fillStyle = `#${(hexInt + x).toString(16)}`; // changed color to blue
    context.fill();
    context.lineWidth = 0.3; // made line width smaller
    context.stroke();
  }

  // draw a line starting from x1,y1 to x2,y2
  function line(x1, y1, x2, y2) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }

  // plot a json data point on the canvas
  function plotCanvasPoint(point) {
    let canvasPoint = toCanvasPoint(point); // scale data point to canvas point
    plotPoint(canvasPoint.x, canvasPoint.y);
  }

  // convert a data point to canvas coordinates
  function toCanvasPoint(point) {
    xCanvas = (point["TOEFL Score"] - 87)*6 + 50; // scale the x point
    yCanvas = 450 - (point["Chance of Admit"] - 0.3)*500; // scale the y point
    // return new x and y
    return {
      x: xCanvas,
      y: yCanvas
    }
  }

  // return a new point with Chance of Admit using Linear Regression Equation
  function regressionLine(toeflScore) {
    return {
      // calculate Chance of Admit
      "Chance of Admit": Math.round((toeflScore*regressionConstants.a + regressionConstants.b)*100)/100,
      "TOEFL Score": toeflScore
    }
  }

  // Draw the regression line
  function drawRegressionLine() {
    let startPoint = regressionLine(290); // Use 290 as line start point
    let endPoint = regressionLine(340); // Use 340 as line end point

    // convert points to Canvas points
    startPoint = toCanvasPoint(startPoint);
    endPoint = toCanvasPoint(endPoint);

    // draw regression line
    line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
  }

  /*********************************************************
                        Regression Functions
  *********************************************************/

  function linearRegression(independent, dependent)
  {
      let lr = {};

      let independent_mean = arithmeticMean(independent);
      let dependent_mean = arithmeticMean(dependent);
      let products_mean = meanOfProducts(independent, dependent);
      let independent_variance = variance(independent);

      lr.a = (products_mean - (independent_mean * dependent_mean) ) / independent_variance;

      lr.b = dependent_mean - (lr.a * independent_mean);

      return lr;
  }


  function arithmeticMean(data)
  {
      let total = 0;

      // note that incrementing total is done within the for loop
      for(let i = 0, l = data.length; i < l; total += data[i], i++);

      return total / data.length;
  }


  function meanOfProducts(data1, data2)
  {
      let total = 0;

      // note that incrementing total is done within the for loop
      for(let i = 0, l = data1.length; i < l; total += (data1[i] * data2[i]), i++);

      return total / data1.length;
  }


  function variance(data)
  {
      let squares = [];

      for(let i = 0, l = data.length; i < l; i++)
      {
          squares[i] = Math.pow(data[i], 2);
      }

      let mean_of_squares = arithmeticMean(squares);
      let mean = arithmeticMean(data);
      let square_of_mean = Math.pow(mean, 2);
      let variance = mean_of_squares - square_of_mean;

      return variance;
  }
})();
