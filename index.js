import { ethers } from 'ethers';

let flashbotsHtml = `
<!DOCTYPE html>
  <style>
      input {height: 2em; width:25%;}
  </style>
  <script src="https://cdn.jsdelivr.net/gh/odyslam/ethtools@feat/flashbots/flashbots.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js"></script>
  <script>
  //TODO:
  // 2. Add field to enter gas you want to pay
  // 3. create function to send bundle
  // 4. Create logic for simple ETH transfers
  //
    function removeTx(div){
      console.log(div);
      div.remove();
      calculateIndex();
    }
    window.onload = function(){
      addTx();
      window.ethereum.enable();
      const bundleId = uuid.v4();
      let rpcEndpoint = "https://rpc.flashbots.net?bundle="+bundleId;
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
        <input type="number" id="gasLimit" name="gasLimit" value="2100"></br>
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
    return await fetch("https://rpc.flashbots.net/bundle?id="+id);
  }

  async function sendBundle() {
      let bundleId = document.getElementById("rpcEndpoint").innerHTML;
      const enable = window.ethereum.enable()
      if(enable){
        const provider = new _ethers.providers.Web3Provider(window.ethereum);
        provider.off('block');
        const signer = provider.getSigner();
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
        const blocksInTheFuture = document.getElementById("targetBlock").value;
        const GWEI = _ethers.BigNumber.from(10).pow(9)
        const priorityFee = GWEI.mul(parseInt(document.getElementById("priorityFee").value));
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock();
        const targetBlockNumber = blockNumber + blocksInTheFuture;
        const maxBaseFeeInFutureBlock = 2 * _FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, blocksInTheFuture)
        let documentBlock = document.getElementById("txDef");
        const flashbotsProvider = await _FlashbotsBundleProvider.create(
          provider,
          authSigner,
          flashbotsRelay
        )
        let transactions = [];
        let txObject= {};
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
            "signer": signer
            }
          transactions.push(txBlock);
        });
        let counter = blocksInTheFuture;
        transactions.forEach( (tx) => {
          signer.sendTransaction(tx.transaction);
        });
        const bundle = await getBundle(bundleId);
        const signedTransactions= await flashbotsProvider.signBundle(bundle.rawTxs.reverse());
        const simulation = await flashbotsProvider.simulate(signedTransactions, targetBlockNumber);
        if ('error' in simulation) {
          window.alert("There was some error in the flashbots simulation, please read the bundle receipt");
          document.getElementById("receipt").innerHTML = simulation.error.message;
        } else {
          window.alert("Flashbots simulation was a success: " + JSON.stringify(simulation, null, 2));
          provider.on('block', async (blockNumber) => {
              const flashbotsSubmission= await flashbotsProvider.sendBundle(
                 transactionBundle,
                 targetBlockNumber,
              );
              window.alert("Bundle Submitted. Waiting...");
              if('error' in bundleSubmission){
                window.alert("There was some error in the flashbots submission, please read the bundle receipt");
                document.getElementById("receipt").innerHTML = bundleSubmission.error.message;
              }
              const waitResponse = await flashbotsSubmission.wait();
              document.getelementbyid("receipt").innerhtml = _FlashbotsBundleResolution[waitResponse];
              if (waitResponse === _FlashbotsBundleResolution.BundleIncluded ){
                window.alert("Your Bundle just got mined!, read the bundle receipt and visit etherscan to verify!");
                provider.off('block');
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
  <body>
    <h1> Create and issue a flashbots bundle! </h1>
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
    <p>Blocks in the Future: The number of blocks in the future in which the bundle should be mined (e.g next block = 1 block in the future)</p>
    <p>Gas Fee: How much do you want to pay the miners to include your bundle? This amount will be paid for each transaction in the bundle.</p>
    <p>Base Fee: Flashbots will try to predict the baseFee of the future block you defined. We define, as a limit, double the predicted baseFee so that we increase the chances of the bundle to be included, even if the baseFee is larger than expected.</>
    <p>Target Address: e.g <code>0x7EeF591A6CC0403b9652E98E88476fe1bF31dDeb </code></p>
    <p>Function Signature: <code>safeTransferFrom(address, address, uint256, uint256, bytes)</code></p>
    <p>Function Arguments: <code>0x8DbD1b711DC621e1404633da156FcC779e1c6f3E 0xD9f3c9CC99548bF3b44a43E0A2D07399EB918ADc 42 1 0x </code></p>
    <p>Transaction Value:0 </p>
    <p>Gas Limit: 100000 </p>
    <input type="button" onclick="sendBundle();" value="Send Bundle!">
    <input type="button" onclick="addTx();" value="Add another Transaction">
    <br>
    <br>
    <label for="targetBlock"><b>Blocks in the future</b></label>
    <input type="number" id="targetBlock" value="1">
    <label for="priorityFee"><b>Priority Fee (GWEI, per transaction)</b></label>
    <input type="number" id="priorityFee" value="3">
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
  <body>
    <p> Various helpful APIs for sovereign individuals and Ethereum afficionados. </p>
    <p> All functionality uses your metamask provider, without ever having access to sensitive information. The client uses ethers-js.</p>
    <p> You can easily inspect the source of this webpage to verify just how simple it is. It uses cloudflare workers to generate the HTML based on the URL.</p>
    <p> <a href="https://github.com/odyslam/ethereum-worker-tools">View on GitHub.</a></p>
    <p><b>/sign/&lt;message&gt;:</b> Sign an arbitrary message with your web3 wallet (e.g metamask). It will return the signed message.</p>
    <p><b>/verify/&lt;address&gt;/&lt;signed_message&gt;/&lt;message&gt;:</b> Verifies that a signed message originates from the specific address.</p>
    <p><b>/send/&lt;contract_address&gt;/&lt;function_signature&gt;/&lt;function_arguments&gt;:</b> Execute a smart contract's function by sending a transaction.<br>
    <b>example:</b> /send/0x7EeF591A6CC0403b9652E98E88476fe1bF31dDeb/safeTransferFrom(address, address, uint256, uint256, bytes)/"0x8DbD1b711DC621e1404633da156FcC779e1c6f3E" "0xD9f3c9CC99548bF3b44a43E0A2D07399EB918ADc" 42 1 ""
    </p>
    <p><b>/call/&lt;contract_address&gt;/&lt;function_signature&gt;/&lt;function_arguments&gt;:</b> Call a smart contract's function without sending a transaction. It reads the state of the smart contract without changing the state on the blockchain.<br>
    <b>example:</b> /call/0x7EeF591A6CC0403b9652E98E88476fe1bF31dDeb/balanceOf(address,uint256) view returns(uint256)/"0x8DbD1b711DC621e1404633da156FcC779e1c6f3E" 42
    </p>
    <p>
      <b>/deploy:</b> Deploy a smart contract. You will need the constructor signature, constructor arguments and the bytecode of the smart contract.
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


