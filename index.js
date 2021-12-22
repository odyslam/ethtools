import { ethers } from 'ethers';

let deployHtml = `
<!DOCTYPE html>
<script src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js"
        type="application/javascript"></script>
  <script>
  async function deployContract(){
      const enable = await window.ethereum.enable();
      if(enable){
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bytecode = document.getElementById("bc").value;
        const constructor = document.getElementById("con").value;
        let args = document.getElementById("args").value;
        args = args.split(" ");
//        for (let arg in args){
//          if (parseInt(args[arg])){
//            args[arg] = ethers.utils.parseUnits(args[arg]);
//          }
//        }
        args = args.join(',');
        const contractABI = [constructor];
        console.log(contractABI, args, bytecode, signer);
        const factory = new ethers.ContractFactory(contractABI, bytecode, signer);
        let command = "factory.deploy(" + args + ")";
        const contract = await eval(command);
        let tx_info = await contract.deployTransaction.wait();
        document.getElementById("tx_info").innerHTML = tx_info;
        }
      }
    </script>
  <head>
    <title>Deploy smart contract</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⛺️ </text></svg>">
    <style>
      body {
        background-color:darkgreen;
        color: lightblue;
        }
      a:visited {
        color: blue;
        }
    </style>
  </head>
<header>
  <h3><a href="/">👈Ethtools</a></h3>
</header>
<h1> Deploy a smart contract <h1>
<h3>Bytecode</h3>
<form>
  <label for="con">Constructor ABI:</label><br>
  <label for "con"><i>e.g: constructor(uint totalSupply, uint id, string memory name)</i></label><br>
  <input type="text" id="con" name="constructor_abi"></br>
  <label for="args">Constructor Arguments</label><br>
  <label for "args"><i>e.g: 100 3 "examplooor"</i></label><br>
  <input type="text" id="args" name="contractor_args"></br>
  <label for="bc">Bytecode:</label><br>
  <input type="text" id="bc" name="bytecode"></br>
  <input type="button" onclick="deployContract();" value="Deploy!">
</form>
<p>
  Transaction Receipt: <span id="tx_info"></span> <br>
</p>
  </body>
</html>
`

let defaultHtml = `
<!DOCTYPE html>
  <head>
    <title>Ethtools</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛠 </text></svg>">
    <style>
      body {
        background-color:darkgreen;
        color: lightblue;
        }
      a:visited {
        color: blue;
        }
    </style>
  </head>
  <body>
    <h1>Ethtools ⚒️</h1>
    <h2>Intro</h2>
    <p> Ethtools is a collection of tools and API endpoints for ethereum users and developers. It's about offering easy-to-use abstractions over existing tooling.</p>
    <p> All functionality uses your metamask provider, thus it will NEVER access any sensitive information.</p>
    <p> You can easily inspect the source of this webpage to verify the code yourself. It's hosted on Cloudflare workers and hand-crafted by odyslam.eth.</p>
    <p> View the source code on <a href="https://github.com/odyslam/ethereum-worker-tools">GitHub</a>. If something doesn't make sense, please open a GitHub issue or submit a PR.</p>
    <p>A project by <a href="https://twitter.com/odyslam_">odyslam.eth</a></p>
    <h2>Index</h2>
    <h3>API endpoints</h3>
    <p>Visit the following endpoints to perform various actions (e.g <i>ethtools.odyslam.com/sign/</i>). Ethtools uses the information you pass on the URL to communicate with metamask and offer the functionality.</p>
    <p>✅ <b>/sign/&lt;message&gt;:</b> Sign an arbitrary message with your web3 wallet (e.g metamask). It will return the signed message.</p>
    <p>✅ <b>/verify/&lt;address&gt;/&lt;signed_message&gt;/&lt;message&gt;:</b> Verifies that a signed message originates from the specific address.</p>
    <p>✅ <b>/send/&lt;contract_address&gt;/&lt;function_signature&gt;/&lt;function_arguments&gt;:</b> Execute a smart contract's function by sending a transaction.<br>
    <br>
    <b>👉 example: </b><a href='/send/0x7EeF591A6CC0403b9652E98E88476fe1bF31dDeb/safeTransferFrom(address, address, uint256, uint256, bytes)/"0x8DbD1b711DC621e1404633da156FcC779e1c6f3E" "0xD9f3c9CC99548bF3b44a43E0A2D07399EB918ADc" 42 1 "0x"'>send/0x7EeF591A6CC0403b9652E98E88476fe1bF31dDeb/safeTransferFrom(address, address, uint256, uint256, bytes)/"0x8DbD1b711DC621e1404633da156FcC779e1c6f3E" "0xD9f3c9CC99548bF3b44a43E0A2D07399EB918ADc" 42 1 "0x"</a>
    </p>
    <p>✅ <b>/call/&lt;contract_address&gt;/&lt;function_signature&gt;/&lt;function_arguments&gt;:</b> Call a smart contract's function without sending a transaction. It reads the state of the smart contract without changing the state on the blockchain.<br>
    <br>
    <b>👉 example: </b><a href='/call/0x7EeF591A6CC0403b9652E98E88476fe1bF31dDeb/balanceOf(address,uint256) view returns(uint256)/"0x8DbD1b711DC621e1404633da156FcC779e1c6f3E" 42'>/call/0x7EeF591A6CC0403b9652E98E88476fe1bF31dDeb/balanceOf(address,uint256) view returns(uint256)/"0x8DbD1b711DC621e1404633da156FcC779e1c6f3E" 42</a>
    </p>
    <h3>Pages</h3>
    <p> The following webpages offer more complex functionality via simple input fields on the webpage. You don't have to encode any information in the URL.</p>
    <p>
      <b><a href="/deploy">/deploy</a></b>: Deploy a smart contract. You will need the constructor signature, constructor arguments and the bytecode of the smart contract.
    </p>
  <body>
</html>
`
let signHtml = `
<!DOCTYPE html>
<script src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js"
        type="application/javascript"></script>
  <script>
  async function signData(){
      const enable = await window.ethereum.enable();
      if(enable){
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        let address = await signer.getAddress();
        let signature = await signer.signMessage("MSG_TO_SIGN");
        document.getElementById("sig").innerHTML = signature;
        document.getElementById("msg").innerHTML = "MSG_TO_SIGN";
        document.getElementById("acc").innerHTML =  address;
        }
      }
  signData();
  </script>
  <head>
    <title>Sign a Message</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✍️ </text></svg>">
    <style>
      body {
        background-color:darkgreen;
        color: lightblue;
        }
      a:visited {
        color: blue;
        }
    </style>
  </head>
<header>
  <h3><a href="/">👈Ethtools</a></h3>
</header>
<body>
    <h1>Sign a Message</h1>
    <p>
    Account: <span id="acc"></span>  <br>
    Message: <span id="msg"></span> <br>
    Signature: <span id="sig"></span> <br>
    </p>
  </body>
</html>`

let sendHtml = `
<!DOCTYPE html>
<script src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js"
        type="application/javascript"></script>
  <script>
  async function sendTransaction(){
      const enable = await window.ethereum.enable();
      if(enable){
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contractAddress = "CONTRACT_ADDRESS";
        const contractABI = ["function FUNCTION_SIGNATURE"];
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        let tx_info = await contract.FUNCTION_METHOD(METHOD_ARGUMENTS);
        let tx_mined = await transaction.wait();
        document.getElementById("tx_info").innerHTML = tx_info;
        document.getElementById("tx_wait").innerHTML = tx_mined;
        }
      }
      sendTransaction();
    </script>
  <head>
    <title>Send a function</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✉️ </text></svg>">
    <style>
      body {
        background-color:darkgreen;
        color: lightblue;
        }
      a:visited {
        color: blue;
        }
    </style>
  </head>
<header>
  <h3><a href="/">👈Ethtools</a></h3>
</header>
<h1> Send a Transaction </h1>
<p>
  Transaction info: <span id="tx_info"></span> <br>
  Transaction mined: <span id="tx_wait"></span> <br>
  </p>
  </body>
</html>`

let callHtml= `
<!DOCTYPE html>
<script src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js"
        type="application/javascript"></script>
  <script>
  async function callTransaction(){
      const enable = await window.ethereum.enable();
      if(enable){
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contractAddress = "CONTRACT_ADDRESS";
        const contractABI = ["function FUNCTION_SIGNATURE"];
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        let tx_info = await contract.FUNCTION_METHOD(METHOD_ARGUMENTS);
        document.getElementById("tx_info").innerHTML = tx_info;
        }
      }
      callTransaction();
    </script>
  <head>
    <title>Call a function</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📞 </text></svg>">
    <style>
      body {
        background-color:darkgreen;
        color: lightblue;
        }
      a:visited {
        color: blue;
        }
    </style>
  </head>
<header>
  <h3><a href="/">👈Ethtools</a></h3>
</header>
<h1> Call a function</h1>
<p>
  Call result: <span id="tx_info"></span> <br>
  </p>
  </body>
</html>


`

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})



async function handleRequest(request) {
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/sign")) {
      let tokens = pathname.split('/');
      let message = decodeURIComponent(tokens.slice(2).join("")).replaceAll(/"/g, '\\\"');
      let output = signHtml.replaceAll("MSG_TO_SIGN", message);
      return new Response(output, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      })
  }
  else if (pathname.startsWith("/verify")) {
    try{
    let  tokens = pathname.split('/');
    let verified = false;
    let  address = tokens[2];
    let signature = tokens[3];
    let message = decodeURIComponent(tokens.slice(4).join("")).replaceall(/"/g, '\\\"');
    let signedAddress = ethers.utils.verifyMessage(message, signature);
    if (signedAddress == address){
      verified = true;
    }
    let response = {
      "address": address,
      "message": message,
      "signature": signature,
      "verified": verified
    };
    return new Response(JSON.stringify(response), {
      headers: {
          "content-type": "application/json",
        },
      })
    }
    catch(error){
      console.error("Error ", error.toString());
      return new Response(JSON.stringify({"error": error}), {
        headers: {
          "content-type": "application/json",
        },
      })
    }
  }
  else if (pathname.startsWith("/send")) {
    let tokens = pathname.split('/');
    let address = tokens[2];
    let signature = decodeURIComponent(tokens[3]);
    let args = decodeURIComponent(tokens[4]);
    args = args.replaceAll(" ", ",");
    let method = signature.split('(')[0];
    let input = sendHtml.replaceAll("CONTRACT_ADDRESS", address);
    input = input.replaceAll("FUNCTION_SIGNATURE", signature);
    input = input.replaceAll("FUNCTION_METHOD", method);
    input = input.replaceAll("METHOD_ARGUMENTS", args);
    return new Response(input, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      })
  }
  else if (pathname.startsWith("/call")) {
    let tokens = pathname.split('/');
    let address = tokens[2];
    let signature = decodeURIComponent(tokens[3]);
    let args = decodeURIComponent(tokens[4]);
    args = args.replaceAll(" ", ",");
    let method = signature.split('(')[0];
    let input = callHtml.replaceAll("CONTRACT_ADDRESS", address);
    input = input.replaceAll("FUNCTION_SIGNATURE", signature);
    input = input.replaceAll("FUNCTION_METHOD", method);
    input = input.replaceAll("METHOD_ARGUMENTS", args);
    return new Response(input, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      })
  }
  else if (pathname.startsWith("/deploy")) {
    return new Response(deployHtml, {
            headers: {
              "content-type": "text/html;charset=UTF-8",
            },
          })
  }
  else {
    return new Response(defaultHtml, {
            headers: {
              "content-type": "text/html;charset=UTF-8",
            },
          })
  }


}
function isNumeric(value) {
    return /^-?\d+$/.test(value);
}


