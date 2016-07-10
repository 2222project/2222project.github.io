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

function geom(list) {
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

// What balance do we need in order to pay $12000/y starting with a $100 donation,
// assuming we pay out 5% per year?
var target_balance = 12000 / 100 / 0.05

// How much do we have to pay in overhead?
var overhead_rate = 0.001

// Simulate payout based on historical returns, for a given distribution rate.
// Result is organized as payout[year][percentile]
function sim_payouts(payout_model) {
  var num_years = 301
  var num_paths = 5000
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
      path.push(total_payout)
//      path.push(payout)
//      path.push(payout_rate)
//      path.push(return_required)
//      path.push(balance)
    }
    paths.push(path)
  }

  // Organize results by year instead of by path
  var result = []
  for (var year=0; year < num_years; year++) {
    var payouts = []
    for (var i=0; i < num_paths; i++) {
      payouts.push(paths[i][year])
    }
    payouts.sort(function(a,b) { return a-b })
    var percentiles = []
    for (var i=0; i < 100; i++) {
      percentiles.push(payouts[i / 100 * num_paths])
    }
    result.push(percentiles)
  }

  return result;
}

function lookup_cell(table, year, percentile) {
  var result
  if (percentile == "arith")
    result = average(table[year])
  else if (percentile == "geom")
    result = geom(table[year])
  else
    result = table[year][percentile]
  return result
}

function format_cell(x) {
  return Number(x.toPrecision(4))
}

function format_percentile(x) {
  if (x == "geom") return "geometric average";
  if (x == "arith") return "arithmetic average";
  return x + " percentile";
}


function run_simulation() {

payouts_15 = sim_payouts(function(r,b,y) { return b * 0.015 })
payouts_20 = sim_payouts(function(r,b,y) { return b * 0.020 })
payouts_40 = sim_payouts(function(r,b,y) { return b * 0.040 })
payouts_60 = sim_payouts(function(r,b,y) { return b * 0.060 })

payouts_preferred_model = sim_payouts(
  function(r,b,y) {
    var return_required = Math.exp(Math.log(target_balance / b) / Math.max(2, 200 - y));
    
    var nominal_rate = 0.015;
    var rampdown_rate;
    if (y > 0)   rampdown_rate = 1.040
    if (y > 20)  rampdown_rate = 1.035
    if (y > 40)  rampdown_rate = 1.030
    if (y > 60)  rampdown_rate = 1.025
    if (y > 80)  rampdown_rate = 1.020
    if (y > 100) rampdown_rate = 1.015
    if (y > 120) rampdown_rate = 1.010
    if (y > 140) rampdown_rate = 1.005
    if (y > 160) rampdown_rate = 1.000

    var payout_rate;
    if (return_required > rampdown_rate)
      payout_rate = Math.max(0.005, 0.015 - (return_required - rampdown_rate))
/*
    else if (return_required < 0.60) payout_rate = nominal_rate + 0.040
    else if (return_required < 0.65) payout_rate = nominal_rate + 0.035
    else if (return_required < 0.70) payout_rate = nominal_rate + 0.030
    else if (return_required < 0.75) payout_rate = nominal_rate + 0.025
    else if (return_required < 0.80) payout_rate = nominal_rate + 0.020
    else if (return_required < 0.85) payout_rate = nominal_rate + 0.015
    else if (return_required < 0.90) payout_rate = nominal_rate + 0.010
    else if (return_required < 0.95) payout_rate = nominal_rate + 0.005
*/
    else                             payout_rate = nominal_rate

    return b * payout_rate
  } )

percentiles = [2, 5, 10, 25, 30, 50, 75, 90, 95, 98, "arith", "geom"]
years = [0, 25, 50, 75, 100, 125, 150, 175, 200]

write_table("preferred model", years, percentiles,
  function(year) { return year },
  function(percentile) { return format_percentile(percentile) },
  function(year,percentile) {
    return format_cell(lookup_cell(payouts_preferred_model, year, percentile))
  })

write_table("reference (flat 1.5% annual)", years, percentiles,
  function(year) { return year },
  function(percentile) { return format_percentile(percentile) },
  function(year,percentile) {
    return format_cell(lookup_cell(payouts_15, year, percentile))
  })

write_table("reference (flat 2% annual)", years, percentiles,
  function(year) { return year },
  function(percentile) { return format_percentile(percentile) },
  function(year,percentile) {
    return format_cell(lookup_cell(payouts_20, year, percentile))
  })

write_table("reference (flat 4% annual)", years, percentiles,
  function(year) { return year },
  function(percentile) { return format_percentile(percentile) },
  function(year,percentile) {
    return format_cell(lookup_cell(payouts_40, year, percentile))
  })

write_table("reference (flat 6% annual)", years, percentiles,
  function(year) { return year },
  function(percentile) { return format_percentile(percentile) },
  function(year,percentile) {
    return format_cell(lookup_cell(payouts_60, year, percentile))
  })

}
