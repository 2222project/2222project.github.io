
function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function deduct_paypal_fees(contribution) {
  return Math.max(0, contribution * 0.983 - 0.3);
}

function project_one_time_contribution(amount) {
  // this is fragile because it depends on the fact that we treat monthly contributions
  // as a series of annual contributions.
  return project_monthly_contribution(amount / 12.0, 1);
}

function project_monthly_contribution(amount, max_year) {
  var result = [];      // :: [ {balance, payout, total_payout} ]
  var balance = 0;
  var total_contribution = 0;
  var total_payout = 0;
  for (var year=0; year <= 210; year++) {
    balance = balance * 1.05;
    if (year < max_year) {
      balance += deduct_paypal_fees(amount) * 12;
      total_contribution += amount * 12;
    };
    var payout = balance * 0.015;
    total_payout += payout;
    result.push( {
      balance: balance,
      payout: payout,
      total_payout: total_payout,
      total_contribution: total_contribution,
    } );
  }
  return result;
}

