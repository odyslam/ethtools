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

    li{
  margin: 10px 0;
}
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

  // Global Variables
  let transactions = [];
  let bundle;
  let flashbotsProvider;
  let blocksInTheFuture;
  let priorityFee;
  let blockNumber;
  let enable;
  let provider;
  const GWEI = _ethers.BigNumber.from(10).pow(9)
  let globalVarSet = false;
  let chainId;
  let bundleId;

   window.onload = function(){
      addTx();
      bundleId = uuid.v4();
      let rpcEndpoint = "https://rpc-staging.flashbots.net?bundle="+bundleId;
      document.getElementById("rpcEndpoint").innerHTML = rpcEndpoint;
    }


  function removeTx(element){
      div.remove();
      calculateIndex();
    }
  function addTx(){
      let str = \`
      <form class="tx" style="margin-top: 15px;">
        <p>---------------------------------------------------------</p>
       <h3> Transaction number <span id="txIndex"></span> signed with address <span id="address"></span> </h3>
        <input type="button" onclick="removeTx(this.parentElement);" value="Remove Transaction">
        <input type="button" onclick="signTx(this.parentElement);" value="Sign Transaction">
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
        <label for="maxBaseGasFee">Max Base Gas Fee (simulated multiple)</label><br>
        <input type="number" id="maxBaseGasFee" name="maxBaseGasFee" step="1" value="3">
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
      child.querySelector("h3 > #txIndex").innerHTML = counter;
      counter++;
      });
  }

  async function getBundle(id){
    let bundle = await fetch("https://rpc-staging.flashbots.net/bundle?id="+id);
    return await bundle.json();
  }


async function setGlobal(){
    enable = window.ethereum.enable();
      if(!enable){
        window.alert("You need to enable Metamask to use the website");
        return null;
      }
      provider = new _ethers.providers.Web3Provider(window.ethereum);
      const authSigner = _ethers.Wallet.createRandom();
      chainId;
      let flashbotsRelay = "https://relay.epheph.com/"
      if (document.getElementById("mainnet").checked) {
        chainId = 1;
      }
      else {
        chainId = 5;
        flashbotsRelay = "https://relay-goerli.flashbots.net/";
      }
      flashbotsProvider = await _FlashbotsBundleProvider.create(
        provider,
        authSigner,
        flashbotsRelay
      )
      priorityFee = GWEI.mul(parseInt(document.getElementById("priorityFee").value));
      blocksInTheFuture = parseInt(document.getElementById("targetBlock").value);
      blockNumber = await provider.getBlockNumber();
      targetBlockNumber = blockNumber + blocksInTheFuture;
      document.getElementById("priorityFee").setAttribute('disabled', 'disabled');
      document.getElementById("targetBlock").setAttribute('disabled', 'disabled');
      globalVarSet = true;
      window.alert("Priority Fee is set to " + priorityFee + " and the target block number is " + targetBlockNumber + " which is " + blocksInTheFuture + " blocks away. To change this, you will need to reset Global Variables and sign again all the transactions.");
}

 function resetGlobal(){
    transactions = [];
    globalVarSet = false;
    bundle = null;
    blocksInTheFuture = null;
    blockNumber = null;
    priorityFee = null;
    chainid = null;
    document.getElementById("priorityFee").removeAttribute('disabled');
    document.getElementById("targetBlock").removeAttribute('disabled');
    window.alert("You can now create a new bundle and set different a)transactions, b) Priority Fee and, c) Blocks in the Future");
 }

  async function signTx(element){
      if (!globalVarSet) {
        window.alert("You need first to choose Priority Fee and Blocks in the Future and click on 'Set Global variables'");
        return null;
      }
      const block = await provider.getBlock();
      priorityFee = GWEI.mul(parseInt(document.getElementById("priorityFee").value));
      const blocksInTheFuture = parseInt(document.getElementById("targetBlock").value);
      let documentBlock = document.getElementById("txDef");
      if (flashbotsProvider == null) {
        setGlobal();
      }
      let txObject= {};
      const maxBaseFeeInFutureBlock = _FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, blocksInTheFuture) * parseInt(element.querySelector("#maxBaseGasFee").value);
      const address = element.querySelector("#targetAddress").value;
      let value = _ethers.BigNumber.from(element.querySelector("#txValue").value);
      const ABI = element.querySelector("#functionSignature").value;
      const calldata =  element.querySelector("#functionArguments").value;
      const gasLimit = element.querySelector("#gasLimit").value;
      const txIndex = parseInt(element.querySelector("h3 > #txIndex").innerHTML);
      let data = '0x';
      if(value == ""){
        value = 0;
      }
      if(ABI != "" && calldata != ""){
        let iface = new _ethers.utils.Interface(["function " + ABI]);
        let string = calldata.split(" ");
        data = iface.encodeFunctionData(ABI, string);
      }
      const eip1559Transaction = {
          to: address,
          type: 2,
          maxFeePerGas: maxBaseFeeInFutureBlock,
          maxPriorityFeePerGas: parseInt(priorityFee),
          gasLimit: parseInt(gasLimit),
          data: data,
          value: parseInt(value),
          chainId: chainId
      }
      transactions[txIndex] = {
          "transaction": eip1559Transaction,
          "signer": null
          }
      const signer = provider.getSigner();
      transactions[txIndex].signer = signer;
      try {
        await signer.sendTransaction(transactions[txIndex].transaction);
        let account = await signer.getAddress()
        window.alert("Transaction number " + txIndex + " was signed succesfully with account: " + account);
        element.querySelector("#address").innerHTML = account ;
      }
      catch(error) {
        window.alert("Got error " + error.code + " when trying to sign the transaction: " + error.message);
      }
  }
  async function sendBundle() {
        if (!globalVarSet){
          window.alert("Please choose Priority Fee and Blocks in the Future and click on 'Set Global variables'");
          return null;
        }
        // If this function has been already called, remove the old event listener
        provider.off('block');
        const protectBundle = await getBundle(bundleId);
        let orderedBundle= [];
        // Often, metamask will send to the RPC endpoint older, already signed transactions. That means that the cache will
        // often return a mix of the transactions we sent plus the transactions that metamask sent. We need to deduplicate and make sure
        // we only use the signed Transactions that we actually signed in this session of the app. The most unique identifier is 'maxFeePerGas'.
        console.log(protectBundle);
        console.log(transactions);
        for(protectTxCounter in protectBundle.rawTxs){
          let signedTx = _ethers.utils.parseTransaction(protectBundle.rawTxs[protectTxCounter])
          console.log(signedTx);
          for(rawTxCounter in transactions){
            let rawTx = transactions[rawTxCounter].transaction;
            console.log(rawTx);
            if(rawTx.data == signedTx.data &&
               rawTx.maxFeePerGas == parseInt(signedTx.maxFeePerGas) &&
               rawTx.value == parseInt(signedTx.value) &&
               rawTx.to == signedTx.to
            ){
              orderedBundle[rawTxCounter] = protectBundle.rawTxs[protectTxCounter];
            }
          }
        }
        if(orderedBundle == []){
          window.alert("No signed transactions were found in the Bundle. Please sign the transactions first");
          return null;
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
          window.alert("Flashbots simulation was a success! Now the bundle will be submitted on every new block until it's mined. Read the Bundle receipt for more info.");
          document.getElementById("receipt").innerHTML = "<p>Simulation Result</p><p>" + JSON.stringify(simulation, null, 2) + "</p>";
          provider.on('block', async (blockNumber) => {
              targetBlockNumber = blockNumber + blocksInTheFuture;
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
  </script>
<header>
  <h3><a href="/">👈Ethtools</a></h3>
</header>
  <body>
    <h1> Create and issue a flashbots bundle 🤖 ⚡️ (Experimental)</h1>
    <p> This page uses a special Flashbots RPC endpoint because Metamask does not allow to sign a transaction without actually sending it to an RPC endpoint. So we sign them, send them to be cached privately by flashbots and finaly, fetch them. The raw signed transcations are processed by the Flashbots Bundle library and sent directly to the Flashbots private relay. All this is done on the browser and the only backend that is used is the flashbots cache/RPC endpoint.</p>
    <p> The source file is very simple and I invite you to <a target="_blank" href="https://github.com/odyslam/ethtools/blob/dbfebee820e303bd027d0dd005693df138119f8f/index.js#L90">take a look</a> and verify it for yourself.</p>
    <h2> Read the Instructions </h2>
    <ol>
      <li>Add the following RPC endpoint to Metamask, with <b>Chain ID = 1</b> and <b>Symbol = ETH</b>: <span id="rpcEndpoint" style="font-weight:bold"></span></li>
      <li>If you are not sure how to do (1), watch <a target="_blank" href="https://www.loom.com/share/916a7da53d034dbe9ca77f1b9d90e7fa">this video</a>. <b>Note that</b> you will have to add a <b>new</b> network with every <b>refresh</b> of this page, as every <b>bundle id</b>(bundle=...) is tied to a unique bundle. Metamask does not allow to edit the RPC endpoint of an existing network, apparently.🤷 </li>
      <li>Add transactions and populate the fields according to the examples below</li>
      <li>You can change the Max Base Gas fee for every transaction. The number you see is a multiple to the MAX gas that flashbots expect to be required for the base fee. The larder the multiple, the larger the max fee you allow to pay and thus higher chances that your transaction will be included in the block. If you set a low multiple (e.g 1x) and the base gas fee is higher for that block, the bundle will not be included.</li>
      <li>Populate the "Blocks in the Future" and "Priority Fee" fields and click on "Set Global Variables". This is required to sign the transactions, are these fields are used in the transactions themselves.</li>
      <li>You can reset the Global Variables at any time, by simply clicking on the "Reset Global Variables" button. You will need to sign all the transactions again.</li>
      <li>Click on "Sign Transaction" to sign the transaction. Make sure you switch Metamask to the account you want to sign the transaction with.</li>
      <li>After you are finished, click on "Send Bundle!"</li>
      <li>The transactions will be sent to flashbots as a bundle to be executed all in the same block. The bundle will be submitted to flashbots on every block to be included in <code>blocks in the future</code>.</li>
      <li> An alert window will pop up to inform you on the success or failure of the submission. The receipt will be printed <b>Bundle Receipt</b> at the end of the page.
      <li>  📍 <b>IMPORTANT</b> After You are done with the website, go to metamask and <a target="_blank" href="https://www.loom.com/share/6bc8a8a161f749a9a9dd84c190634d47"> reset the accounts</a> that you used to send/sign transactions. Metamask will attempt to resend the transactions as soon as you switch networks. As the transactions are not issued on the blockchain, but simply cached to the Flashbots endpoint and then brought back to be submitted via a bundle, Metamask assumes that the transactions failed and sends them again.</li>
      <li>  📍 If the receipt shows <code>BlocMinedWithoutInclusion</code>, that's OK. You will get this message until the bundle is included. To increase the chance of inclusion, you might want to increase the <b>Priority Fee</b>.</li>
      <li>  📍 If the receipt shows <code>nonce too low, tx X state Y</code>, that means that metamask has messed up the tx nonces. Send the Bundle again and manually set the nonce of the appropriate transaction to the number <code>Y</code> shown in the error message. Alternatively, you can reset your metamask Accounts, clearing the tx queue and fixing the nonces.</li>
      <li>  📍  Currently, to offer a better UX, we set the default <code>maxBaseFee</code> that you are willing to pay to 3 times the <code>maxBaseFee</code> that Flashbts predicts for the block that will include your Bundle. The block number is computed as: <code>currentBlockNumber + blocksInTheFuture</code>. This is an <b> UPPER BOUND</b> of the <code>baseFee</code> and not what you will actually pay. This is done so that there is a margin for error to the calculated <code>maxBaseFee</code> and you don't have to sign the transactions again every time the actual <code>baseFee</code> is higher than the predicted <code>maxBaseFee</code>. This means that you will need to send more ETH to an account in order to potentially cover the higher <code>maxBaseFee</code>. You can read more about this on <a href="https://github.com/flashbots/ethers-provider-flashbots-bundle#gas-prices-and-eip-1559" target="_blank">GitHub</a>.</li>
      <li>  📍 If you want to change something to the Bundle, you can make the change and click on <b>Send The Bundle!</b. It will stop sending the previous bundle and start submitting the new one.</l>
    <ol>
    <h2>Fields Reference</h2>
    <p><b>Blocks in the Future</b>: The number of blocks in the future in which the bundle should be mined (e.g next block = 1 block in the future)</p>
    <p><b>Gas Fee</b>: How much do you want to pay the miners to include your bundle? This amount will be paid for each transaction in the bundle.</p>
    <p><b>Target Address</b>: <code>0x7EeF591A6CC0403b9652E98E88476fe1bF31dDeb </code></p>
    <p><b>Function Signature</b>: <code>safeTransferFrom(address, address, uint256, uint256, bytes)</code></p>
    <p><b>Function Arguments</b>: <code>0x8DbD1b711DC621e1404633da156FcC779e1c6f3E 0xD9f3c9CC99548bF3b44a43E0A2D07399EB918ADc 42 1 0x </code></p>
    <p><b>Transaction Value</b>: <code>0</code> </p>
    <p><b>Gas Limit</b>: <code>100000</code></p>
    <input type="button" onclick="sendBundle();" value="Send Bundle!">
    <input type="button" onclick="addTx();" value="Add another Transaction">
    <input type="button" onclick="setGlobal();" value="Set Global variables">
    <input type="button" onclick="resetGlobal();" value="Reset Global variables">
    <br>
    <br>
    <label for="targetBlock"><b>Blocks in the future</b></label>
    <input type="number" id="targetBlock" value="4">
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
    <p><b><a href="/deploy">/deploy</a></b>: Deploy a smart contract. You will need the constructor signature, constructor arguments and the bytecode of the smart contract.</p>
    <p><b><a href="/flashbots">/flashbots</a></b>: Submit a Bundle of transactions to Flashbots. It means that all transactions will be included in the same block, in the order you define.</p>
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
