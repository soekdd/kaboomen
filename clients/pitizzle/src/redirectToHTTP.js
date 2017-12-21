function redirectToHTTP(){
	let url = window.location.href;
	
	if(url.indexOf("https://") != -1){
		let a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		a.href = url.replace("https://", "http://");
		
		console.log(".. redirecting to HTTP");
		a.click();
	}else{
	    console.log("now HTTP");
	}
}
document.addEventListener("DOMContentLoaded", redirectToHTTP);