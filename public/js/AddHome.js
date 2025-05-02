document.getElementById('homeForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent default form submission

    // Show the loading spinner
    document.getElementById('loadingSpinner').style.display = 'block';

    // Create FormData object to submit the form data
    const formData = new FormData(this);

    // Submit the form using fetch
    fetch(this.action, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json()) // Expecting JSON response from the server
    .then(data => {
        // Hide the loading spinner
        document.getElementById('loadingSpinner').style.display = 'none';

        if (data.success) {
            // You can show a success message or redirect the user
            alert('Home added/updated successfully!');
            window.location.href = '/host/admin_HomeList'; // Optional: Redirect to the home list
        } else {
            // Show an error message if something went wrong
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        // Hide the loading spinner and show an error
        document.getElementById('loadingSpinner').style.display = 'none';
        alert('An error occurred during submission: ' + error.message);
    });
});