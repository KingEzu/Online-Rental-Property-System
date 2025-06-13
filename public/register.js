const form = document.querySelector('form');
const messageViews = document.querySelectorAll('form > p');

form.addEventListener('submit', async (e)=> {
    e.preventDefault();
    const {firstName, lastName, email, gender, password, passwordRepeat} = form;

    try {
        const res = await fetch('/auth/register', { 
            body: JSON.stringify({   
            'firstName' : firstName.value, 
            'lastName' : lastName.value, 
            'email' : email.value, 
            'gender' : gender.value, 
            'password' : password.value,
            'passwordRepeat' : passwordRepeat.value,
        }),
        headers : {"Content-Type": 'application/json'},
        method : 'POST'
        }).then(res => {
            return res.json();
        }).then(data => {
            showMessages(data);
        }).catch(err => 
            console.error(err)
        ); 
    } catch (error) {
        console.log(error); 
    }
})


const showMessages = (data) =>{

    const result = data.result.body;

    const messages = [
    "Only characters are allowed!",
    "Only characters are allowed!",
    "User already exists with the given email!",
    "Password must contain atleast 1 uppercase, symbol and number.",
    "Passwords do not match!"];

    if (data.result.error) {
        messageViews.forEach((view, index) =>{
            view.textContent = result[index] === 0 ? messages[index] : "";
        })
        document.getElementById('registration-status').style.display = 'block';
        document.getElementById('registration-status').textContent = data.result.message;
        
        window.scrollTo(0,0);
    }else{
        form.reset();
        messageViews.forEach(v => v.textContent = '');
        document.getElementById('registration-status').style.visibility = 'visible';
        document.getElementById('registration-status').textContent = data.result.message;
        window.scrollTo(0,0);
    }
}

const onReset = () =>{
    document.getElementById('registration-status').style.visibility = 'gone';
    messageViews.forEach((view) =>{
        view.textContent = '';
    });
}