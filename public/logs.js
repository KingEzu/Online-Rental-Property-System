document.addEventListener('DOMContentLoaded', () => {
    const logContainer = document.getElementById('log-container');
    const clearButton = document.getElementById('clear-button');
    function fetchLogs() {
     fetch(
      '/admin/logData',{
        headers : {
          "Content-Type": 'application/json'
        },
        method : 'GET'
      }
    )
     .then((res) => res.json())
     .then((data) => {
      Array.from(data).map((e,i) => {
         logContainer.innerHTML += 
         `<div class="log-entry">${i+1} \t ${e.timestamp} ${String(e.log)}</div>`
      })
     })
     .catch((error) => {
      alert("Failed to fetch logs!")
     })
    }
    clearButton.addEventListener('click', () => {
      logContainer.innerHTML = '';
    });

    fetchLogs();
  });