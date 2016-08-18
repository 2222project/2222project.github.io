
function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function extrapolate_monthly_contribution(amount, max_year) {
  var result = [];      // :: [ {balance, payout, total_payout} ]
  var balance = 0;
  var total_payout = 0;
  for (var year=0; year <= 210; year++) {
    balance = balance * 1.05;
    if (year < max_year) {    // assume contributions stop after 10 years
      var contribution = (amount * 0.983 - 0.3) * 12;    // account for paypal fees
      balance = balance + contribution;
    };
    var payout = balance * 0.015;
    total_payout = total_payout + payout;
    result.push( {
      balance: balance,
      payout: payout,
      total_payout: total_payout,
    } );
  }
  return result;
}

