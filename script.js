const cellTypes = ["text", "number", "number", "text", "button"];
const placeholders = ["Item", "Age", "Amount", "Name", "Button"];

function addRow() {
  var table = document.getElementById("expensesTable").getElementsByTagName('tbody')[0];
  var newRow = table.insertRow(table.rows.length);

  // Item column
  var itemCell = newRow.insertCell(0);
  var itemInput = document.createElement("input");
  itemInput.type = "text";
  itemInput.className = "form-control";
  itemCell.appendChild(itemInput);

  // Age column
  var ageCell = newRow.insertCell(1);
  var ageInput = document.createElement("input");
  ageInput.type = "number";
  ageInput.className = "form-control age";
  ageCell.appendChild(ageInput);
  ageInput.setAttribute("oninput", "removeLeadingZero(this);calculateReturn()");


  // Amount Needed column
  var amountCell = newRow.insertCell(2);
  var inputGroup = document.createElement("div");
  inputGroup.className = "input-group";
  var rupeeSpan = document.createElement("span");
  rupeeSpan.className = "input-group-text rupee-symbol";
  rupeeSpan.textContent = "₹";
  inputGroup.appendChild(rupeeSpan);
  var amountInput = document.createElement("input");
  amountInput.type = "text";
  amountInput.className = "form-control amount-needed";
  amountInput.setAttribute("pattern", "\\d*");
  amountInput.setAttribute("oninput", "formatCurrency(this);removeLeadingZero(this);calculateReturn()");
  inputGroup.appendChild(amountInput);
  amountCell.appendChild(inputGroup);

  // Remove button column
  var removeCell = newRow.insertCell(3);
  var removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "btn btn-danger";
  removeButton.setAttribute("title", "Remove this Row");
  removeButton.setAttribute("onclick", "removeRow(this);calculateReturn()");
  var removeIcon = document.createElement("i");
  removeIcon.className = "fas fa-minus";
  removeButton.appendChild(removeIcon);
  removeCell.appendChild(removeButton);
  updatePlaceholders();
}


function removeRow(button) {
  var row = button.parentNode.parentNode;
  row.parentNode.removeChild(row);
  updatePlaceholders();
}

function updatePlaceholders() {
  var table = document.getElementById("expensesTable");
  for (var i = 1, row; row = table.rows[i]; i++) {
    row.cells[0].children[0].placeholder = "Item " + i;
  }
}

//calculate Return
var totalAmountAtRetirement;

function calculateReturn() {
  var currentAge = parseInt(document.getElementById("currentAge").value);
  var retirementAge = parseInt(document.getElementById("retirementAge").value);
  var annualReturn = parseFloat(document.getElementById("annualReturn").value.replace('%', '')) / 100;
  var monthlySIP = parseFloat(document.getElementById("monthlySIPOutput").value.replace(/₹|,/g, ''));
  var annualInflation = parseFloat(document.getElementById("annualInflation").value.replace('%', '')) / 100;
  var annualSIPChange = parseFloat(document.getElementById("annualSIPChange").value.replace('%', '')) / 100;
  var lumpsumInvestment = parseFloat(document.getElementById("lumpsumInvestment").value.replace(/,/g, '')); 

  var currentYear = new Date().getFullYear();
  var retirementYear = currentYear + (retirementAge - currentAge);

  document.getElementById("retirementYear").textContent = retirementYear;
  document.getElementById("retirementYear1").textContent = retirementYear;
  document.getElementById("inflation").textContent = parseInt(document.getElementById("annualInflation").value.replace('%', ''));
  document.getElementById("return").textContent = parseFloat(document.getElementById("annualReturn").value.replace('%', ''));
  document.getElementById("duration").textContent = retirementAge - currentAge;
  // Reduce the real return rate by the inflation rate to get an adjusted return rate
  annualReturn = annualReturn - annualInflation;

  // Input validation
  if (isNaN(currentAge) || isNaN(retirementAge) || isNaN(annualReturn) || isNaN(monthlySIP) || isNaN(annualInflation) || isNaN(annualSIPChange) || isNaN(lumpsumInvestment)) {
    alert("Please enter valid input values");
    return;
  }

  var expensesData = getExpensesAtAges();

  var monthsToRetirement = (retirementAge - currentAge) * 12;
  var results = [];
  var totalAmount = lumpsumInvestment;

  for (var month = 1; month <= monthsToRetirement; month++) {
    // Calculate the monthly return as a percentage of totalAmount at the beginning of the month
    var returnAmount = (totalAmount * annualReturn / 12);
    
    // Update totalAmount with monthlySIP and returnAmount
    totalAmount += monthlySIP;
    totalAmount += returnAmount;

    // Adjust the monthlySIP at the end of every year to account for the annual change
    if (month % 12 === 0) {
      monthlySIP *= (1 + annualSIPChange);
    }

    // Check if there are any expenses for the current age and subtract them from the totalAmount
    var currentAgeInYears = currentAge + Math.floor(month / 12);
    if (expensesData[currentAgeInYears]) {
      totalAmount -= expensesData[currentAgeInYears];
    } else if (expensesData.beforeRetirement && expensesData.beforeRetirement[currentAgeInYears]) {
      totalAmount -= expensesData.beforeRetirement[currentAgeInYears];
    }

    results.push({
      month: month,
      amount: monthlySIP,
      return: returnAmount,
      totalAmount: totalAmount
    });
  }
  
  // Calculate the estimated return (totalAmount at retirement - total investment)
  // var estimatedReturn = totalAmount - (lumpsumInvestment + (monthlySIP * monthsToRetirement));

  // Calculate the total amount at retirement
  var totalAmountAtRetirement = totalAmount;
    
  // Display the total amount at retirement
  var totalAmountRounded = parseInt(totalAmountAtRetirement);
  // var totalAmountRounded = parseFloat(totalAmountAtRetirement).toFixed(2);
  var formattedTotalAmountAtRetirement = formatAmountIndianStyle(totalAmountRounded);
  document.getElementById("totalAmountAtRetirement").value = formattedTotalAmountAtRetirement;

  // Unhide the sections by setting the style to "display: block;"
  document.getElementById('resultsContainer').style.display = 'block';
  const totalInvestment = Math.round(results.reduce((sum, result) => sum + result.amount, 0))+lumpsumInvestment;

  // Calculate the total return
  var totalReturn = Math.round(results[results.length - 1].totalAmount - totalInvestment);
  document.getElementById("investmentAmount").textContent = totalInvestment.toLocaleString('en-IN', {maximumFractionDigits: 2});
  document.getElementById("totalReturn").textContent = totalReturn.toLocaleString('en-IN', {maximumFractionDigits: 2});

  //Making the value displayed in totalReturn and totalAmountAtRetirement to be same.
  // Assuming the calculation for total return has been done and the value is set in the <span>
  var totalReturnSpan = document.getElementById("totalReturn").textContent;

  // Parsing the value to a number, assuming it's a plain number without formatting
  var totalReturnAmount = parseFloat(totalReturnSpan.replace(/[^0-9.-]+/g, ""));

  // Formatting the total return amount (if necessary)
  var formattedTotalReturnAmount = formatAmountIndianStyle(totalReturnAmount);

  // Setting the formatted value to the totalAmountAtRetirement input field
  document.getElementById("totalAmountAtRetirement").value = formattedTotalReturnAmount;

  // Display the results
  displayResults(results);
  generatePieChart(results);
  // Generate the line chart
  generateLineChart(results);
  calculateYearsLeft(totalReturn) 
  
}


const lossMessages = [
  "Overspent? Got a golden goose?",
  "Spending past your limit? Bold move!",
  "Dipping deeper than your pockets go?",
  "Hope your wallet's got nine lives!",
  // "Overspending? Must be nice to print money!",
  "Beyond your budget? Living on the edge!",
  // "Wallet crying out? Time for a rescue mission!",
  // "Did you buy a premium course on 'How to Grow Money Trees'?"
  // "Spending past your limit? Must've enrolled in 'Bold Moves 101' online!",
  // "Dipping deeper? Is that the 'Art of Pocket Diving' course from DU?",
  // "Wallet on its ninth life? Maybe it's time for a financial CPR class!",
  // "Printing money on the side? Share that webinar link!",
  // "Beyond budget? Did you major in 'Edge Living' from JNU?",
  // "Wallet's SOS call? Time for a crash course in 'Wallet Wellness'!"
];

const profitMessages = [
  "Nailed it! Financial guru!!",
  "On point with those finances!",
  "Money mastermind? That's you!",
  "Finances? You've aced it!",
  // "Look at you, the Warren Buffet of backyard finance!",
  // "Money whisperer? Heard your wallet giggle!",
  // "Budgeting like a boss? Give that wallet a promotion!",
  // "Midas touch in finance? Even Lakshmi Ji would be proud!",
  // "Budgeting like a pro? Bet you've got a secret Swiss account!",
  // "Financial wizardry? Hogwarts or IIM?",
  // "Mastered finances? Coursera or Udemy?"
  // "Budgeting like an IIM grad without even attending one!",
  // "Who needs a finance degree when you've got skills like these?",
  // "Are you secretly take an online course for money management?",
  // "Your wallet's GPA? A solid 10/10. Top of the financial class!",

];

function getRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Create a pie chart with the total investment and total return
function generatePieChart(results) {
  if (window.pieChart) {
    window.pieChart.destroy();
  }

  // Calculate the total investment
  const totalInvestment = results.reduce((sum, result) => sum + result.amount, 0);

  // Calculate the total return
  const totalReturn = results[results.length - 1].totalAmount - totalInvestment;
    // Determine the labels and colors based on the totalReturn value
    const labels = totalReturn < 0 ? ["Investment", "Loss"] : ["Investment", "Return/Profit"];
    const backgroundColors = totalReturn < 0 ? ["#06818d", "#FF5733"] : ["#06818d", "#8CC63E"];
    const hoverBackground = totalReturn < 0 ? ["#2C7DA0", "#FF5733"] : ["#2C7DA5", "#8CC63F"];
    const textHeader = totalReturn < 0 ? getRandomMessage(lossMessages) : getRandomMessage(profitMessages);

    // Create a new pie chart
    window.pieChart = new Chart(document.getElementById("InvestmentVsReturn"), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: [Math.floor(totalInvestment), Math.floor(Math.abs(totalReturn))], // Always use positive integer value for data
          backgroundColor: backgroundColors,
          borderColor: ["#FFFFFF", "#FFFFFF"],
          borderWidth: 3,
          hoverBorderColor: hoverBackground, // Adjust hover color if it's a loss
        }]
      },
    options: {
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'index'},
       maintainAspectRatio: false,

       plugins: {
        title: {
            display: true,
            text: textHeader,
            font: {
                size: 25,
                style: 'bold',
                family: 'Arial', // You can set your preferred font family
            },
            color: "#495057",
            maxWidth: 300, // Set a maximum width for the title
            overflow: 'ellipsis', // Use ellipsis for overflowing text
            padding: {top: 10, bottom: 10} // Add some padding to ensure the title doesn't touch the edges
        }
    },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          fontColor: "#495057",
          fontSize: 16,
          usePointStyle: true,
        }
      },
      tooltips: {
        enabled: true,
        backgroundColor: "#FFFFFF",
        bodyFontColor: "#495057",
        titleFontColor: "#495057",
        borderColor: "#CCCCCC",
        borderWidth: 1,
        caretPadding: 10,
  callbacks: {
        label: function(tooltipItem, data) {
            let label = data.labels[tooltipItem.index] || '';
            let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
            value = '₹' + parseInt(value).toLocaleString('en-IN'); // Format the value with Rupee symbol and Indian format
            return label + ': ' + value;
        }
    }
      },
      animation: {
        duration: 1, // Duration of animation in milliseconds
        easing: 'easeInOutCubic', // Easing function to create a smooth, circular animation effect
      },
      hover: {
        animationDuration: 8, // Duration of animation when hovering over a slice
        mode: 'nearest', // Hover mode configuration
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
        }
      },
    
    }
  });
}

function calculateYearsLeft(totalAmountAtRetirement) {
  
  var currentAge = parseInt(document.getElementById("currentAge").value);
  var retirementYear = currentYear + (retirementAge - currentAge);

  // Get the totalAmount from the calculateReturn function
  var totalAmount = totalAmountAtRetirement; // use the parameter directly

  // Get values from HTML elements
  var retirementAge = parseInt(document.getElementById("retirementAge").value);
  var monthlyExpenses = parseInt(document.getElementById("monthlyExpenses").value.replace(/,/g, ''));
  var expectedIncrease = parseFloat(document.getElementById("expectedIncrease").value.replace('%', '')) / 100;
  var annualInflation = parseFloat(document.getElementById("annualInflation").value.replace('%', '')) / 100;
  
  // Retrieve the expenses data
  var expensesData = getExpensesAtAges();
  
  // Input validation
  if (isNaN(retirementAge) || isNaN(monthlyExpenses) || isNaN(expectedIncrease) || isNaN(annualInflation)) {
    alert("Please enter valid input values");
    return;
  }


  // Create an array to store the depreciation data
  var depreciationData = [];

  // Calculate the number of years left before the amount finishes off
  var years = 0;
  //Adding this logic to get the amount same as return amount at the starting of the retirement year.
  // Calculate the yearly expenses at the beginning of the retirement year
  var yearlyExpensesAtRetirement = monthlyExpenses * 12 * (1 + annualInflation);
  
   // Calculate the initial total amount by adding the yearly expenses at retirement year to the total amount at retirement
   totalAmount += yearlyExpensesAtRetirement;
 
  while (totalAmount >= 0) {
     // Get the current age based on the retirement year and the number of years passed
     var currentAgeDuringRetirement = retirementAge + years;
    
     // Subtract expenses for the current year if any
     if(expensesData[currentAgeDuringRetirement]) {
       totalAmount -= expensesData[currentAgeDuringRetirement];
     }
 
    if (years > 0) {    
      monthlyExpenses *= (1 + expectedIncrease);
    }
    
    // Calculate yearly expenses considering inflation
    var yearlyExpenses = monthlyExpenses * 12 * (1 + annualInflation);
    // var yearlyExpenses = monthlyExpenses * 12 
    
    // Deduct yearly expenses from total amount
    totalAmount -= yearlyExpenses; 
    
    // Check if total amount is less than zero, if yes, break the loop
    if (totalAmount < 0) {
      break;
    }
    
    // Adding a condition to prevent potential infinite loop
    if (years > 1000) {
      alert("The calculation is taking too long, please check the input values.");
      break;
    }
    
    years++;
  
    // Add the remaining amount to the depreciation data array
    depreciationData.push(totalAmount);
  }  

  // Display the number of years left
  document.getElementById("years").textContent = years;
 
  
  // Get the current year
  var currentYear = new Date().getFullYear();

  // Get the current age from the input
  var currentAge = parseInt(document.getElementById("currentAge").value);

  // Get the retirement age from the input
  var retirementAge = parseInt(document.getElementById("retirementAge").value);

  // Validate the inputs
  if (isNaN(currentAge) || isNaN(retirementAge) || currentAge >= retirementAge) {
    alert("Please enter valid current age and retirement age values");
    return;
  }

  // Calculate the number of years left until retirement
  var yearsUntilRetirement = retirementAge - currentAge;

  // Calculate the retirement year
  var retirementYear = currentYear + yearsUntilRetirement;

  console.log("Retirement Year: " + retirementYear);

    // Create an array of years starting from the retirement age
    var yearLabels = Array.from({ length: depreciationData.length }, (_, i) => retirementYear + i);

    // Create a line chart using Chart.js
    if(window.myChart) {
      window.myChart.destroy();
    }

    var ctx = document.getElementById('depreciationChart').getContext('2d');
    window.myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: yearLabels,
        datasets: [{
          label: 'Amount Left',
          data: depreciationData.map(value => Math.floor(value)), // Convert each value to an integer
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: false,
          backgroundColor: function(context) {
            var chart = context.chart;
            var gradient = chart.ctx.createLinearGradient(0, 0, chart.width, chart.height);
            gradient.addColorStop(0, 'rgba(75, 192, 192, 0.5)');
            gradient.addColorStop(1, 'rgba(75, 192, 192, 0)');
            return gradient;
          },
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
          pointBorderWidth: 1,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          title: {
            display: true,
            text: 'Your Yearly Expense',
            font: {
              size: 24,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 30
            }
          },
          tooltip: {
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            titleColor: '#fff',
            titleFont: {
              size: 16,
              weight: 'bold'
            },
            bodyColor: '#fff',
            bodyFont: {
              size: 14
            },
            callbacks: {
              label: function(tooltipItem) {
                  var value = tooltipItem.parsed.y;
                  return 'Amount Left: ₹' + value.toLocaleString('en-IN');
              }
          }
            
          },
          legend: {
            labels: {
              color: '#333',
              font: {
                size: 14
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Years',
              font: {
                size: 16,
                weight: 'bold'
              },
              color: '#333'
            },
            grid: {
              display: false
            }
          },
          y: {
            title: {
              display: true,
              text: 'Remaining Amount',
              font: {
                size: 16,
                weight: 'bold'
              },
              color: '#333'
            },
            grid: {
              display: false
            }
          },
          
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart'
        },
        transitions: {
          show: {
            animation: {
              duration: 500
            }
          },
          hide: {
            animation: {
              duration: 500
            }
          }
        }
      }
    });
        
      // Set the value of the output element
      const yearsElement = document.getElementById('years');
      const yearsDisplay = document.getElementById('yearsDisplay');
      yearsDisplay.textContent = years;
      yearsElement.value = years;  

    // Display the number of years left
    document.getElementById("years").textContent = years;
    // Returning the calculated number of years
    return years;
}

function displayResults(results) {
  var table = document.getElementById("resultsTable").getElementsByTagName('tbody')[0];
  table.innerHTML = ""; // Clear the table before displaying new results

  results.forEach(result => {
    var row = table.insertRow();
    row.insertCell(0).innerText = result.month;
    row.insertCell(1).innerText = result.amount.toFixed(2);
    row.insertCell(2).innerText = result.return.toFixed(2);
    row.insertCell(3).innerText = result.totalAmount.toFixed(2);
  });
}

//line chart
// function generateLineChart(results) {
  // var months = [];
  // var totalAmounts = [];

  // results.forEach(result => {
  //   months.push(result.month);
  //   totalAmounts.push(result.totalAmount);
  // });

  // var ctx = document.getElementById('returnChart').getContext('2d');

  // // If a chart already exists, destroy it before creating a new one
  // if(window.myLineChart) {
  //   window.myLineChart.destroy();
  // }
  function generateLineChart(results) {
    var yearlyData = {};
    
    results.forEach(result => {
      // Assuming the result.month represents the month number (1-12) from the start of the investment
      var year = Math.ceil(result.month / 12);
      
      if (!yearlyData[year]) {
        yearlyData[year] = {
          totalAmount: 0,
          count: 0
        };
      }
      
      yearlyData[year].totalAmount += result.totalAmount;
      yearlyData[year].count++;
    });
  
    var yearLabels = Object.keys(yearlyData).map(year => parseInt(year) + new Date().getFullYear() - 1); // Convert year number to actual year
    var totalAmountsByYear = Object.values(yearlyData).map(data => data.totalAmount / data.count); // Average amount for the year
  
    var ctx = document.getElementById('returnChart').getContext('2d');
  
    // If a chart already exists, destroy it before creating a new one
    if(window.myLineChart) {
      window.myLineChart.destroy();
    }

  window.myLineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: yearLabels,
      datasets: [{
        label: 'Total Amount',
      data: totalAmountsByYear.map(value => Math.floor(value)), // Convert each value to an integer
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: false,
    
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderWidth: 1,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },

      plugins: {
        title: {
          display: true,
          text: 'Your Yearly Saving',
          font: {
            size: 24,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 30
          }
        },
        tooltip: {
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          titleColor: '#fff',
          titleFont: {
            size: 16,
            weight: 'bold'
          },
          bodyColor: '#fff',
          bodyFont: {
            size: 14
          },
          callbacks: {
            label: function(tooltipItem) {
                var value = tooltipItem.parsed.y;
                return 'Total Amount: ₹' + value.toLocaleString('en-IN');
            }
        }
        },
        legend: {
          labels: {
            color: '#333',
            font: {
              size: 14
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Year',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#333'
          },
          grid: {
            display: false
          }
        },
        y: {
          title: {
            display: true,
            text: 'Total Amount',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#333'
          },
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart'
      },
      transitions: {
        show: {
          animation: {
            duration: 500
          }
        },
        hide: {
          animation: {
            duration: 500
          }
        }
      }
    }
  });
}

//Toggle Collapse
function toggleCollapse() {
  const icon = document.querySelector('i[data-bs-toggle="collapse"][data-bs-target="#collapseTable"]');

  if (icon.classList.contains('fas fa-chevron-down')) {
    icon.classList.remove('fas fa-chevron-down');
    icon.classList.add('fas fa-chevron-up');
  } else {
    icon.classList.remove('fas fa-chevron-up');
    icon.classList.add('fas fa-chevron-down');
  }
}

// This function prevents the user from entering negative values or the letter 'e' in the input fields
function restrictNegativeInput(event) {
  if (event.key === '-' || event.key === 'e') {
    event.preventDefault(); // Prevents the input from being accepted
  }
}

// This function removes leading zeros from the input fields to avoid incorrect calculations
function removeLeadingZero(element) {
  // Extract numeric characters from the input value
  let value = element.value.replace(/[^0-9]/g, '');
  
  // Convert the sanitized string to an integer to remove leading zeros; 
  // if the result is NaN (input was empty or non-numeric), default to an empty string
  value = parseInt(value, 10) || '0';
  
  // If the value is non-empty, format it as a currency string (adding commas as thousands separators)
  if(value !== '') {
    element.value = value.toLocaleString('en-IN', {minimumFractionDigits: 0});
  } else {
    // If the value is empty, set the element value to an empty string
    element.value = '';
  }
}


function validatePercentage(inputElement) {
  // Get the input value
  const inputValue = inputElement.value;

  // Regular expression to match a valid percentage format (e.g., "20%")
  const percentageRegex = /^\d+(\.\d{1,2})?%?$/;

  if (!percentageRegex.test(inputValue)) {
    // Display an error message or handle the validation failure here
    alert("Please enter a valid percentage (e.g., 20% or 0.5).");
    // Optionally, you can clear the input field or take other actions
    inputElement.value = ""; // Clear the input field
    inputElement.focus(); // Set focus back to the input field
    return false; // Return false to indicate validation failure
  }

  // If the input is a valid percentage, you can proceed with further actions
  return true; // Return true to indicate validation success
}

//format currency
function formatAmountIndianStyle(x) {
  x = x.toString();
  var afterPoint = '';
  if (x.indexOf('.') > 0)
      afterPoint = x.substring(x.indexOf('.'), x.length);
  x = Math.floor(x);
  x = x.toString();
  var lastThree = x.substring(x.length - 3);
  var otherNumbers = x.substring(0, x.length - 3);
  if (otherNumbers !== '')
      lastThree = ',' + lastThree;
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + afterPoint;
}


function formatCurrency(value) {
  // Convert the value to a floating-point number and round it to 2 decimal places
  var output = parseFloat(value).toFixed(2);

  // Add commas for the thousands place (e.g., 10,000)
  output = output.replace(/(\d+)(\d{3})(\.|\b)/, '$1,$2$3');

  // Add commas for lakhs and crores places (e.g., 10,00,000 and 10,00,00,000)
  output = output.replace(/(\d+)(\d{2})(,\d{3})(\.|\b)/, '$1,$2$3$4');

  return output;
}

function updatePercentageValue(outputId, value) {
  document.getElementById(outputId).textContent = value + '%';
}

function getExpensesAtAges() {
  const tableRows = document.querySelectorAll("#expensesTable tbody tr");
  let expensesData = {};
  tableRows.forEach(row => {
    let age = parseInt(row.querySelector('.age').value, 10);
    let amountNeeded = parseInt(row.querySelector('.amount-needed').value.replace(/,/g, ''), 10);
    
    if(!isNaN(age) && !isNaN(amountNeeded)) {
      if(expensesData[age]) {
        expensesData[age] += amountNeeded;
      } else {
        expensesData[age] = amountNeeded;
      }
    }
  });
  return expensesData;
}

function updatePercentageValue(outputId, value) {
  document.getElementById(outputId).textContent = value + '%';
}

function changeSliderColor(slider) {
  const percentage = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.background = `linear-gradient(to right, #06818d ${percentage}%, #d9d9d9 ${percentage}%)`;
}

function updateTextboxFromSlider(outputId, value) {
  var output = document.getElementById(outputId);
  output.value = value + "%";
  changeSliderColor(document.getElementById('annualReturn'));
  calculateReturn();
}

function updateSliderFromTextbox(sliderId, value) {
  var slider = document.getElementById(sliderId);
  var percentageValue = parseInt(value.replace('%', ''));
  if (!isNaN(percentageValue) && percentageValue >= 0 && percentageValue <= 100) {
      slider.value = percentageValue;
      changeSliderColor(slider);
      calculateReturn();
  }
}

function getChartConfig(labels, data, titleText) {
  return {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Amount Left',
        data: data,
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: false,
        backgroundColor: function(context) {
          var chart = context.chart;
          var gradient = chart.ctx.createLinearGradient(0, 0, chart.width, chart.height);
          gradient.addColorStop(0, 'rgba(75, 192, 192, 0.5)');
          gradient.addColorStop(1, 'rgba(75, 192, 192, 0)');
          return gradient;
        },
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderWidth: 1,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        title: {
          display: true,
          text: titleText,
          font: {
            size: 24,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 30
          }
        },
        tooltip: {
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          titleColor: '#fff',
          titleFont: {
            size: 16,
            weight: 'bold'
          },
          bodyColor: '#fff',
          bodyFont: {
            size: 14
          },
        },
        legend: {
          labels: {
            color: '#333',
            font: {
              size: 14
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Years',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#333'
          },
          grid: {
            display: false
          }
        },
        y: {
          title: {
            display: true,
            text: 'Remaining Amount',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#333'
          },
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart'
      },
      transitions: {
        show: {
          animation: {
            duration: 500
          }
        },
        hide: {
          animation: {
            duration: 500
          }
        }
      }
    }
  };
}

//for minimum amount after retirement
// function setDefaultIfEmpty(inputElement) {
//   if (!inputElement.value) {
//       inputElement.value = "100";
//   }
// }

function checkZeroValue(inputElement) {
  if (inputElement.value === "0") {
      inputElement.value = "1";
  }
}

//format table currecncy
function formatTableCurrency() {
    var table = document.getElementById("resultsTable");
    var rows = table.getElementsByTagName("tr");
    for (var i = 1; i < rows.length; i++) {
        var cells = rows[i].getElementsByTagName("td");
        for (var j = 1; j < cells.length; j++) {
            var value = parseFloat(cells[j].innerText.replace(/,/g, '')); // Remove existing commas and parse as float
            if (!isNaN(value)) {
                cells[j].innerText = formatCurrency(value);
            }
        }
    }
}

function toggleVisibility(elementId) {
  var element = document.getElementById(elementId);
  if (element.style.display === "none") {
      element.style.display = "block";
      document.getElementById('toggleAssumptions').innerText = 'Assumptions';
  } else {
      element.style.display = "none";
      document.getElementById('toggleAssumptions').innerText = '*Assumptions';
  }
}



function updateTextboxFromSliderWithPercentage(textboxId, value) {
  document.getElementById(textboxId).value = parseFloat(value).toFixed(1) + '%';
}


function updateTextboxFromSliderWithRupee(textboxId, value) {
  document.getElementById(textboxId).value = '₹' + parseInt(value).toLocaleString();
}

function updateSliderFromTextboxWithPercentage(sliderId, value) {
  value = value.replace('%', '');
  document.getElementById(sliderId).value = value;
  updateSliderBackground(document.getElementById(sliderId));
}

function updateSliderFromTextboxWithRupee(sliderId, value) {
  value = value.replace('₹', '').replace(',', '');
  document.getElementById(sliderId).value = value;
  updateSliderBackground(document.getElementById(sliderId));
}

function updateSliderBackground(slider) {
  const percentage = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.background = `linear-gradient(to right, #06818d 0%, #06818d ${percentage}%, #d9d9d9 ${percentage}%, #d9d9d9 100%)`;
}

// // Initial background update for both sliders
// window.onload = function() {
//   updateSliderBackground(document.getElementById('monthlySIP'));
//   updateSliderBackground(document.getElementById('annualReturn'));
//   updateSliderBackground(document.getElementById('annualSIPChange'));  
// }
function updateTextboxFromSliderWithPercentage(textboxId, value) {
  document.getElementById(textboxId).value = value + '%';
}

function updateTextboxFromSliderWithRupee(textboxId, value) {
  document.getElementById(textboxId).value = '₹' + parseInt(value).toLocaleString();
}

function updateSliderFromTextboxWithPercentage(sliderId, value) {
  value = value.replace('%', '');
  document.getElementById(sliderId).value = value;
  updateSliderBackground(document.getElementById(sliderId));
}

function updateSliderFromTextboxWithRupee(sliderId, value) {
  value = value.replace('₹', '').replace(',', '');
  document.getElementById(sliderId).value = value;
  updateSliderBackground(document.getElementById(sliderId));
}

function updateSliderBackground(slider) {
  const percentage = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.background = `linear-gradient(to right, #06818d 0%, #06818d ${percentage}%, #d9d9d9 ${percentage}%, #d9d9d9 100%)`;
}

// Initial background update for both sliders
window.onload = function() {
  updateSliderBackground(document.getElementById('monthlySIP'));
  updateSliderBackground(document.getElementById('annualReturn'));
  updateSliderBackground(document.getElementById('monthlyExpenses'));
  updateSliderBackground(document.getElementById('annualSIPChange'));  
  updateSliderBackground(document.getElementById('annualInflation')); 
  updateSliderBackground(document.getElementById('expectedIncrease')); 


  calculateReturn();//By default the result should appear
}

function calculateTotal() {
  const rent = document.getElementById('rent').value || 0;
  const food = document.getElementById('food').value || 0;
  const utilities = document.getElementById('utilities').value || 0;
  const transportation = document.getElementById('transportation').value || 0;
  const miscellaneous = document.getElementById('miscellaneous').value || 0;

  const total = Number(rent) + Number(food) + Number(utilities) + Number(transportation) + Number(miscellaneous);
  document.getElementById('totalCost').textContent = `Total Monthly Cost: ${total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`;
}
