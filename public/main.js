/* Moralis init code */
// REPLACE THE BELOW SERVER_URL and APP_ID with your own
/* Authentication code */
async function login() {
  let user = Moralis.User.current();
  if (!user) {
    user = await Moralis.authenticate({
      signingMessage: "Log in using Moralis"
    })
      .then(function (user) {
        console.log("logged in user:", user);
        let ethAddress = user.get("ethAddress");
        document.getElementById("btn-login").style.display = "none";
    
        document.getElementById("div-wallet").style.display = "inline-block";
        document.getElementById("div-wallet").innerHTML = slicedWallet(user.get("accounts")[0]);
    
        document.getElementById("btn-logout").style.display = "inline-block";
    
        document.getElementById(
          "myethAddress"
        ).textContent = `Logged in Eth Address ${ethAddress}`;
      })
      .catch(function (error) {
        console.log(error);
      });
  } else {
    let ethAddress = user.get("ethAddress");
    document.getElementById(
      "myethAddress"
    ).textContent = `Already Logged in ${ethAddress}`;
  }
}

async function logOut() {
  await Moralis.User.logOut();
  document.getElementById("btn-login").style.display = "inline-block";
  document.getElementById("div-wallet").style.display = "none";
  document.getElementById("btn-logout").style.display = "none";

  document.getElementById("myethAddress").textContent = "";
  console.log("logged out");
}

document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logOut;

//End authentication

const configApp = () => {
	let user = Moralis.User.current();
	console.log(user, 'user')
	if (user) {
	  document.getElementById("btn-login").style.display = "none";
	  document.getElementById("div-wallet").innerHTML = slicedWallet(user.get("accounts")[0]);
	} else {
	  document.getElementById("div-wallet").style.display = "none";
	  document.getElementById("btn-logout").style.display = "none";
	}
  }
  
  configApp();