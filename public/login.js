const form = document.querySelector('form');
const signinButton = document.getElementById('signinButton');

form.addEventListener('submit', async (e)=> {
    e.preventDefault();

    const {email, password} = form;
    try {
        signinButton.setAttribute("textContent","Waiting...");
        signinButton.setAttribute("cursor","not-allowed");
        fetch(
            '/auth/signin', { 
            body: JSON.stringify({   
            'email' : email.value, 
            'password' : password.value
            }),
            headers : {"Content-Type": 'application/json'},
            method : 'POST'
        }).then(res => {
            signinButton.setAttribute("textContent","Waiting...");
            signinButton.setAttribute("cursor","not-allowed");
            return res.json();
        }).then(data =>{
            if (data.success) {
                location.href = "/admin/metrics";
            }else{
                location.href = "/admin/signin";
                alert(data.message);
            }
        })
        .catch(err => {
            signinButton.setAttribute("textContent","Sign In");
            signinButton.setAttribute("cursor","pointer");
            console.error(err)
        }); 
    } catch (error) {
        console.log(error); 
        alert("Something Went Wrong!");
    }
});

const onReset = () =>{
    messageViews.forEach((view) =>{
        view.textContent = '';
    });
}