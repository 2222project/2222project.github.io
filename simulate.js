// historical returns of the stock market
var returns = [
13.82, 9.44, 3.10, 11.09, 11.24, -13.36, 12.48, 34.73, 26.27, 29.30,
-6.61, 5.68, 2.73, -2.81, 31.65, 17.72, -6.63, 3.34, 13.95, -7.35,
25.22, 4.74, -11.83, 9.91, 1.92, 4.7, 20.37, 27.42, -10.77, 25.61,
13.48, 0.73, -11.97, 25.94, 21.29, -3.88, -23.35, 36.37, 4.54, 5.01,
5.82, -0.55, -7.59, -6.33, 28.65, -4.00, -31.09, -1.85, 4.47, -16.17,
23.5, 32.12, 3.01, 27.10, 21.61, 12.77, 40.27, 49.30, -9.99, -17.44,
-38.47, 4.98, 55.60, -9.38, 50.44, 30.66, -34.00, 20.86, 2.98, -9.56,
-17.30, 11.66, 20.05, 16.98, 36.29, -25.55, -5.77, 6.33, 18.42, 26.76,
16.13, 17.46, -1.54, 57.16, 27.74, 3.30, -11.85, 40.92, 9.69, -2.07,
27.65, -10.39, 21.05, 15.47, 10.33, -13.36, 20.78, 6.03, -13.96, -1.87,
10.92, 15.23, -21.83, -34.97, 29.48, 18.44, -13.57, -2.39, 4.76, 17.99,
-13.08, 16.75, 18.63, 1.93, 27.40, 17.77, 1.20, 11.70, 26.14, -8.98,
27.06, 4.57, 7.22, -1.45, 34.60, 19.10, 31.43, 26.69, 17.94, -12.09,
-13.32, -24.07, 26.35, 7.33, 1.33, 12.87, 1.34, -37.28, 23.75, 13.14,
-0.87, 13.91, 30.50, 12.94, 0.57 ]
for (var i=0; i < returns.length; i++) {
  returns[i] = returns[i] / 100 + 1
}

// What balance do we need in order to pay $12000/y starting with a $100 donation,
// assuming we pay out 5% per year?
var target_balance = 12000 / 100 / 0.05

// How much do we have to pay in overhead?
var overhead_rate = 0.001

var num_years = 201
var num_paths = 5000

var sorted_returns = returns.slice().sort(function(a,b) { return a-b })
var n_returns = sorted_returns.length

// Generates a random return based on historical returns, with interpolation.
// Also includes a little bit of extrapolation, to avoid biasing against extreme
// returns.
function random_return() {
  var r = Math.random() * n_returns - 0.5;
  var index = Math.floor(r)
  var lambda = r - index
  var r1, r2
  if (index < 0) {
    // extrapolate below the worst recorded historical return
    r2 = sorted_returns[0]
    r1 = 2 * sorted_returns[0] - sorted_returns[1];
  }
  else if (index >= n_returns - 1) {
    // extrapolate above the best recorded historical return
    r1 = sorted_returns[n_returns-1]
    r2 = 2 * r1 - sorted_returns[n_returns-2]
  }
  else {
    r1 = sorted_returns[index]
    r2 = sorted_returns[index + 1]
  }

  return ( (1 - lambda) * r1 + lambda * r2 );
}

// Print a table where the contents of each cell is calculated by by a function
function write_table(title, xs, ys, f_x, f_y, f_cell) {
  document.write("<table cellpadding=3>")
  document.write("<tr><td></td><td colspan=", xs.length, "><b>", title, "</b></td></tr>")
  document.write("<tr><td></td>")
  for (var x = 0; x < xs.length; x++) {
    document.write("<td>", f_x(xs[x]), "</td>")
  }
  document.write("</tr>")
  for (var y=0; y < ys.length; y++) {
    document.write("<tr><td>", f_y(ys[y]), "</td>")
    for (var x = 0; x < xs.length; x++) {
      document.write("<td>", f_cell(xs[x], ys[y]), "</td>")
    }
    document.write("</tr>")
  }
  document.write("</table>")
}

function average(list) {
  var sum = 0;
  var count = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i] >= 0 || list[i] <= 0) {
      sum = sum + list[i]
      count++
    }
  }
  return sum / count
}

function geometric_average(list) {
  var logs = 0;
  var count = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i] >= 0 || list[i] <= 0) {
      logs = logs + Math.log(list[i])
      count++
    }
  }
  return Math.exp(logs / count)
}

// Simulate paths based on historical returns, for a given distribution rate.
function simulate(payout_model) {
  var paths = []
  for (var i=0; i < num_paths; i++) {
    var balance = 1
    var total_payout = 0
    var path = []
    for (var year=0; year < num_years; year++) {
      var r = random_return()
      var payout = payout_model(r, balance, year)
      var payout_rate = payout / balance
      balance = balance * (r - overhead_rate) - payout
      total_payout = total_payout + payout
      var return_required = Math.exp(Math.log(target_balance / balance) / Math.max(2, 200 - year))
      var return_so_far = Math.exp(Math.log(balance) / (year+1))
      path.push({
        payout: payout,
        total_payout: total_payout,
        payout_rate: payout_rate,
        return_required: return_required,
        return_so_far: return_so_far,
        balance: balance,
      });
    }
    paths.push(path)
  }
  return paths;
}

function make_percentiles(paths, selector) {
  // Organize results by year instead of by path
  var result = []
  for (var year=0; year < num_years; year++) {
    var values = []
    for (var i=0; i < num_paths; i++) {
      var value = paths[i][year][selector]
      if (value == null)
        throw "no value for selector '" + selector + "'";
      values.push(value);
    }
    values.sort(function(a,b) { return a-b })
    var percentiles = []
    for (var i=0; i < 100; i++) {
      percentiles.push(values[i / 100 * num_paths])
    }
    result.push(percentiles)
  }

  return result;
}

function write_percentiles(title, values, years, percentiles) {
  var years = [25, 50, 75, 100, 125, 150, 175, 200];
  var percentiles = [5, 10, 25, 50, 75, 90, 95, "arith", "geom"];

  write_table(title, years, percentiles,
    function(year) {
      return year
    },
    function(percentile) {
      if (percentile == "geom") return "geometric average";
      if (percentile == "arith") return "arithmetic average";
      return percentile + " percentile";
    },
    function(year, percentile) {
      var x;
      var style_begin = "";
      var style_end = "";
      if (percentile == "arith") {
        x = average(values[year])
        style_begin = "<i>";
        style_end = "</i>";
      }
      else if (percentile == "geom") {
        x = geometric_average(values[year])
        style_begin = "<i>";
        style_end = "</i>";
      }
      else {
        x = values[year][percentile];
        if (percentile == 50) {
          style_begin = "<b>";
          style_end = "</b>";
        }
      }
      return style_begin + String(Number(x.toPrecision(4))) + style_end;
    })
}

function run_simulation() {

function preferred_model(r,b,y) {
  var return_required = Math.exp(Math.log(target_balance / b) / Math.max(2, 200 - y));
  var return_so_far = Math.exp(Math.log(b) / (y+1));

  var minimum_rate = 0.005;
  var target_rate = 0.015;

  var payout_rate;
  if (return_so_far < 1.06 && return_required > 1.02)
    payout_rate = minimum_rate;
  else
    payout_rate = target_rate;

  payout_rate = minimum_rate;

  return b * payout_rate;
}

document.write("<h1>Model: distribute 1.5% every year</h1>");

paths = simulate(function(r,b,y) { return b * 0.015 })
write_percentiles("annual payout",     make_percentiles(paths, "payout"))
write_percentiles("cumulative payout", make_percentiles(paths, "total_payout"))
write_percentiles("balance",           make_percentiles(paths, "balance"))
write_percentiles("return so far",     make_percentiles(paths, "return_so_far"))

document.write("<h1>Model: distribute 0.5-1.5% depending on actual returns</h1>");

paths = simulate(preferred_model)
write_percentiles("annual payout",     make_percentiles(paths, "payout"))
write_percentiles("cumulative payout", make_percentiles(paths, "total_payout"))
write_percentiles("balance",           make_percentiles(paths, "balance"))
write_percentiles("payout rate",       make_percentiles(paths, "payout_rate"))
write_percentiles("return required",   make_percentiles(paths, "return_required"))
write_percentiles("return so far",     make_percentiles(paths, "return_so_far"))

/*
document.write("<h1>Model: 4% always</h1>");

paths = simulate(function(r,b,y) { return b * 0.040 })
write_percentiles("annual payout",     make_percentiles(paths, "payout"))
write_percentiles("cumulative payout", make_percentiles(paths, "total_payout"))
write_percentiles("balance",           make_percentiles(paths, "balance"))

document.write("<h1>Model: 6% always</h1>");

paths = simulate(function(r,b,y) { return b * 0.060 })
write_percentiles("annual payout",     make_percentiles(paths, "payout"))
write_percentiles("cumulative payout", make_percentiles(paths, "total_payout"))
write_percentiles("balance",           make_percentiles(paths, "balance"))
*/

}

