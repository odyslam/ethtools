import { ethers } from 'ethers';

let twitterHtml = `
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
      input {height: 2em; width:25%;}
    </style>
  </head>
  <script>
  </script>
`
let flashbotsHtml = `
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
      input {height: 2em; width:25%;}
    </style>
  </head>
  <script src="https://cdn.jsdelivr.net/gh/odyslam/ethtools/flashbots.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js"></script>
  <script>
    function removeTx(div){
      console.log(div);
      div.remove();
      calculateIndex();
    }
    window.onload = function(){
      addTx();
      window.ethereum.enable();
      const bundleId = uuid.v4();
      let rpcEndpoint = "https://rpc-staging.flashbots.net?bundle="+bundleId;
      document.getElementById("rpcEndpoint").innerHTML = rpcEndpoint;
    }
    function addTx(){
      let str = \`
      <form class="tx" style="margin-top: 15px;">
        <p>---------------------------------------------------------</p>
       <h3> Transaction number <span class="txIndex"></span></h3>
        <input type="button" onclick="removeTx(this.parentElement);" value="Remove tx">
        <br>
        <label for="addr">Target Address</label><br>
        <input type="text" id="targetAddress" name="targetAddress"></br>
        <label for="fun">Function signature</label><br>
        <input type="text" id="functionSignature" name="functionSignature"></br>
        <label for="args">Function Arguments</label><br>
        <input type="text" id="functionArguments" name="functionArguments"></br>
        <label for="txValue">Transaction value</label><br>
        <input type="number" id="txValue" name="txValue" value="0"></br>
        <label for="gasLimit">Gas Limit</label><br>
        <input type="number" id="gasLimit" name="gasLimit" value="21000"></br>
      </form>
      \`
      let txBlock = document.getElementById("txDef");
      txBlock.insertAdjacentHTML( 'beforeend', str );
      calculateIndex();
    }
  function calculateIndex(){
    let el = document.getElementById("txDef").children;
    let counter = 0;
    Array.from(el).forEach( (child) => {
      let span = child.getElementsByClassName("txIndex")[0];
      span.innerHTML = counter;
      counter++;
      });
  }

  async function getBundle(id){
    let bundle = await fetch("https://rpc-staging.flashbots.net/bundle?id="+id);
    return await bundle.json();
  }

  async function sendBundle() {
      let bundleId = document.getElementById("rpcEndpoint").innerHTML.split("=")[1];
      const enable = window.ethereum.enable()
      if(enable){
        const provider = new _ethers.providers.Web3Provider(window.ethereum);
        provider.off('block');
        const authSigner = _ethers.Wallet.createRandom();
        let chainId;
        let flashbotsRelay = "https://relay.epheph.com/"
        if (document.getElementById("mainnet").checked) {
          chainId = 1;
        }
        else {
          chainId = 5;
          flashbotsRelay = "https://relay-goerli.flashbots.net/";
        }
        const blocksInTheFuture = parseInt(document.getElementById("targetBlock").value);
        const GWEI = _ethers.BigNumber.from(10).pow(9)
        const priorityFee = GWEI.mul(parseInt(document.getElementById("priorityFee").value));
        let documentBlock = document.getElementById("txDef");
        const flashbotsProvider = await _FlashbotsBundleProvider.create(
          provider,
          authSigner,
          flashbotsRelay
        )
        let transactions = [];
        let txObject= {};
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock();
        const targetBlockNumber = blockNumber + blocksInTheFuture;
        const maxBaseFeeInFutureBlock = 3 * _FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, blocksInTheFuture)
        Array.from(documentBlock.children).forEach((tx) => {
          const address = tx.querySelector("#targetAddress").value;
          const txValue= tx.querySelector("#txValue").value;
          const ABI = tx.querySelector("#functionSignature").value;
          const calldata =  tx.querySelector("#functionArguments").value;
          const gasLimit = tx.querySelector("#gasLimit").value;
          let data = '0x';
          let value = 0;
          if(ABI != "" && calldata != ""){
            let iface = new _ethers.utils.Interface(["function " + ABI]);
            let string = calldata.split(" ");
            data = iface.encodeFunctionData(ABI, string);
          }
          value = txValue;
          tx["address"] = address;
          const eip1559Transaction = {
              to: address,
              type: 2,
              maxFeePerGas: parseInt(maxBaseFeeInFutureBlock),
              maxPriorityFeePerGas: parseInt(priorityFee),
              gasLimit: parseInt(gasLimit),
              data: data,
              value: parseInt(value),
              chainId: chainId
          }
          txBlock = {
            "transaction": eip1559Transaction,
            "signer": null
            }
          transactions.push(txBlock);
        });
        let counter = blocksInTheFuture;
        for (const index in transactions){
          window.alert("Please use metamask to switch the account from which you want to send the transaction number " + index + ".\\nDon't close this window until metamask is set to the correct account.");
          const signer = provider.getSigner();
          transactions[index].signer = signer;
          await signer.sendTransaction(transactions[index].transaction);
        }
        const protectBundle = await getBundle(bundleId);
        let orderedBundle= [];
        for(protectTxCounter in protectBundle.rawTxs){
          let signedTx = _ethers.utils.parseTransaction(protectBundle.rawTxs[protectTxCounter])
          for(rawTxCounter in transactions){
            let rawTx = transactions[rawTxCounter].transaction;
            if(rawTx.data == signedTx.data &&
               rawTx.maxFeePerGas == parseInt(signedTx.maxFeePerGas) &&
               rawTx.value == parseInt(signedTx.value) &&
               rawTx.to == signedTx.to
            ){
              orderedBundle[rawTxCounter] = protectBundle.rawTxs[protectTxCounter];
            }
          }
        }
        const simulation = await flashbotsProvider.simulate(orderedBundle, targetBlockNumber);
        if ('error' in simulation) {
          window.alert("There was some error in the flashbots simulation, please read the bundle receipt");
          document.getElementById("receipt").innerHTML = simulation.error.message;
        } else {
          let finalBundle = [];
          for(counter in orderedBundle){
            finalBundle.push({"signedTransaction": orderedBundle[counter]});
          }
          window.alert("Flashbots simulation was a success! Read the Bundle receipt for more info.");
          document.getElementById("receipt").innerHTML = "<p>Simulation Result</p><p>" + JSON.stringify(simulation, null, 2) + "</p>";
          provider.on('block', async (blockNumber) => {
              const flashbotsSubmission= await flashbotsProvider.sendBundle(
                 finalBundle,
                 targetBlockNumber,
              );
              if('error' in flashbotsSubmission){
                window.alert("There was some error in the flashbots submission, please read the bundle receipt");
                document.getElementById("receipt").innerHTML = bundleSubmission.error.message;
              }
              const waitResponse = await flashbotsSubmission.wait();
              document.getElementById("receipt").innerHTML= _FlashbotsBundleResolution[waitResponse];
              if (waitResponse === _FlashbotsBundleResolution.BundleIncluded ){
                provider.off('block');
                window.alert("Your Bundle just got mined!, read the bundle receipt and visit etherscan to verify!");
              }
              else if (waitResponse === _FlashbotsBundleResolution.AccountNonceTooHigh){
                window.alert("Flashbots encountered an error: AccountNonceTooHigh");
                provider.off('block');
              }
          });
        }
      }
      else {
        window.alert("Metamask is disabled. Please enable Metamask");
      }
  }
  </script>
<header>
  <h3><a href="/">👈Ethtools</a></h3>
</header>
  <body>
    <h1> Create and issue a flashbots bundle 🤖 ⚡️ (Experimental)</h1>
    <h2> Instructions </h2>
    <ol>
      <li>Add the following RPC endpoint to Metamask: <span id="rpcEndpoint" style="font-weight:bold"></span></li>
      <li>If you are not sure how to do (1), watch <a href="">this video</a>. If you have done this step before, just update the RPC endpoint you added before with this new one.</li>
      <li>Add transactions and populate the fields according to the examples below</li>
      <li>When you click on <b>Send the Bundle!</b> metamask will prompt you to sign the transactions</li>
      <li>The transactions will be sent to flashbots as a bundle to be executed all in the same block. </li>
      <li> An alert window will pop up to inform you on the success or failure of the submission. The receipt will be printed in the field at the end of the page.</li>
    <ol>
    <h2>Fields Reference</h2>
    <p><b>Blocks in the Future</b>: The number of blocks in the future in which the bundle should be mined (e.g next block = 1 block in the future)</p>
    <p><b>Gas Fee</b>: How much do you want to pay the miners to include your bundle? This amount will be paid for each transaction in the bundle.</p>
    <p><b>Base Fee</b>: Flashbots will try to predict the baseFee of the future block you defined. We define, as a limit, double the predicted baseFee so that we increase the chances of the bundle to be included, even if the baseFee is larger than expected.</>
    <p><b>Target Address</b>: <code>0x7EeF591A6CC0403b9652E98E88476fe1bF31dDeb </code></p>
    <p><b>Function Signature</b>: <code>safeTransferFrom(address, address, uint256, uint256, bytes)</code></p>
    <p><b>Function Arguments</b>: <code>0x8DbD1b711DC621e1404633da156FcC779e1c6f3E 0xD9f3c9CC99548bF3b44a43E0A2D07399EB918ADc 42 1 0x </code></p>
    <p><b>Transaction Value</b>: <code>0</code> </p>
    <p><b>Gas Limit</b>: <code>100000</code></p>
    <input type="button" onclick="sendBundle();" value="Send Bundle!">
    <input type="button" onclick="addTx();" value="Add another Transaction">
    <br>
    <br>
    <label for="targetBlock"><b>Blocks in the future</b></label>
    <input type="number" id="targetBlock" value="3">
    <label for="priorityFee"><b>Priority Fee (GWEI, per transaction)</b></label>
    <input type="number" id="priorityFee" value="2">
    <h3>Network</h3>
    <label for="mainnet">Ethereum Mainnet (Default)</label><br>
    <input name="network" type="radio" id="mainnet" checked="true" value="Mainnet">
    <br>
    <div id="txDef" style="margin-top: 20px;">
    </div>
    <h3> Bundle Receipt </h3>
    <div id="receipt"></div>
  </body>
</html>
`


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
    <h1> ⚒️  Ethtools</h1>
    <h2>Intro</h2>
    <p> Ethtools is a collection of tools and API endpoints for ethereum users and developers. It's about offering easy-to-use abstractions over existing tooling.</p>
    <p> All functionality uses your metamask provider, thus it will NEVER access any sensitive information.</p>
    <p> You can easily inspect the source of this webpage to verify the code yourself. It's hosted on Cloudflare workers.</p>
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
  else if (pathname.startsWith("/flashbots")) {
    return new Response(flashbotsHtml, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
    })
  }
  else if (pathname.startsWith("/tweetdrop")) {
    return new Response(twitterHtml, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        }
    });
  }
  else {
    return new Response(defaultHtml, {
            headers: {
              "content-type": "text/html;charset=UTF-8",
            },
          })
  }
}
