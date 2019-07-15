import Caver from "caver-js";
import {Spinner} from "spin.js";
const config = {
  rpcURL: 'https://api.baobab.klaytn.net:8651'
}
const cav = new Caver(config.rpcURL);
//webpack 에서 만들어진 전역상수를 이용해서 넘김
const agContract = new cav.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS);
const App = {
  auth:{
    accessType: 'keystore',
    keystore: '',
    password: ''
  },
  //bapp 이 시작할때 가장먼저 시작하는 함수
  start: async function () {
    const walletFromSession = sessionStorage.getItem('walletInstance');
    if (walletFromSession) {
      try {
        cav.klay.accounts.wallet.add(JSON.parse(walletFromSession));
        this.changeUI(JSON.parse(walletFromSession));
      } catch (e) {
        sessionStorage.removeItem('walletInstance');
      }
    }
  },

  handleImport: async function () {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]);
    fileReader.onload = (event) => {
      try {
        if (!this.checkValidKeystore(event.target.result)){
          $('#message').text('유효하지 않은 keystore 파일입니다. ');
          return; 
        }
        this.auth.keystore = event.target.result;
        $('#message').text('keystore 통과. 비밀번호를 입력하세요.');
        document.querySelector('#input-password').focus();
      } catch (evnet){
        $('#message').text('유효하지 않은 keystore 파일입니다.');
        return;
      }
    }
  },

  handlePassword: async function () {
    this.auth.password = event.target.value;
  },

  handleLogin: async function () {
    if (this.auth.accessType === 'keystore'){
      try {
        const privateKey = cav.klay.accounts.decrypt(this.auth.keystore, this.auth.password).privateKey;
        this.integrateWallet(privateKey);
      } catch(e) {
        $('#message').text('비밀번호가 일치하지 않습니다.');
      }
    }

  },

  handleLogout: async function () {
    this.removeWallet();
    //page 새로고침
    location.reload();
  },

  generateNumbers: async function () {
    var num1 = Math.floor((Math.random() * 50) + 10);
    var num2 = Math.floor((Math.random() * 50) + 10);
    sessionStorage.setItem('result',num1+num2);

    $('#start').hide();
    $('#num1').text(num1);
    $('#num2').text(num2);
    $('#question').show();
    document.querySelector('#answer').focus();

    this.showTimer();
  },

  submitAnswer: async function () {
    const result = sessionStorage.getItem('result');
    var answer = $('#answer').val();
    if (answer === result) {
      if (confirm("성공 0.1 KLAY 받기")) {
        if (await this.callContractBalance() >= 0.1) {
          this.receiveKlay();
        }
        else {
          alert("죄송합니다.. 컨트렉의 KLAY가 다 소모되었습니다.");
        }        
      }
    }
    else {
      alert("떙! 초등학생도 하는데 ? ㅋ");
    }
  },

  deposit: async function () {
    var spinner = this.showSpinner();
    //주최자만 보낼 수 있음, contract 접촉해서 주최자인지 확인
    const walletInstance = this.getWallet();
    if (walletInstance) {
      if (await this.callOwner() !== walletInstance.address) return;
      else {
        var amount = $('#amount').val();
        if (amount) {
          agContract.methods.deposit().send({
            //누가 호출한건지 , gas , value 세개 필수
            from: walletInstance.address,
            gas: '300000',
            value: cav.utils.toPeb(amount, "KLAY")
          })
          .once('transactionHash', (txHash) => {
            console.log(`txHash: ${txHash}`);
          })
          .once('receipt', (receipt) => {
            console.log(`(#${receipt.blockNumber})`,receipt);
            spinner.stop();
            alert(amount + " KLAY를 컨트렉에 송금했습니다.");
            location.reload();
          })
          .once('error', (error) => {
            alert(error.message);
          });
        }
        return;
      }
    }
  },

  callOwner: async function () {
    //await 는 비동기
    return await agContract.methods.owner().call();
  },

  callContractBalance: async function () {
    return await agContract.methods.getBalance().call();
  },

  getWallet: function () {
    if (cav.klay.accounts.wallet.length) {
      return cav.klay.accounts.wallet[0]; // 0번째 인덱스는 제일 첫번째 계정 즉 로그인된 계정
    }
  },

  checkValidKeystore: function (keystore) {
    //keystore json 파일을 분해해서 js 오브젝트로 변환
    const parsedKeystore = JSON.parse(keystore);
    //id,address,address,crypto 가 있어야 유효한 keystore 파일
    const isValidKeystore = parsedKeystore.version &&
      parsedKeystore.id &&
      parsedKeystore.address &&
      parsedKeystore.crypto;

      return isValidKeystore;
  },

  integrateWallet: function (privateKey) {
    const walletInstance = cav.klay.accounts.privateKeyToAccount(privateKey);
    cav.klay.accounts.wallet.add(walletInstance);
    //key , value 계정이 로그인된 상태를 유지하기 위해 사용
    sessionStorage.setItem('walletInstance', JSON.stringify(walletInstance));
    this.changeUI(walletInstance);
  },

  reset: function () {
    this.auth ={
      keystore: '',
      password: '',
    };
  },

  changeUI: async function (walletInstance) {
    $('#loginModal').modal('hide');
    $('#login').hide();
    $('#logout').show();
    $('#game').show();
    $('#address').append('<br>' + '<p>' + '내 계정주소: ' + walletInstance.address + '</p>');
    $('#contractBalance')
    .append('<p>' + '이벤트 잔액: ' + cav.utils.fromPeb(await this.callContractBalance(), "KLAY") + 'KLAY' + '</p>');
    
    //owner 와 로그인한 주소와 같을 때만 
    if (await this.callOwner() === walletInstance.address) {
      $('#owner').show();
    }
  },

  removeWallet: function () {
    cav.klay.accounts.wallet.clear();
    //key 값으로 세션 지우기
    sessionStorage.removeItem('walletInstance');
    //전역변수 auth 초기화
    this.reset();
  },

  showTimer: function () {
    var seconds = 3;
    $('#timer').text(seconds);

    var interval = setInterval(() => {
      $('#timer').text(--seconds);
      if (seconds <= 0) {
        $('#timer').text('');
        $('#answer').val('');
        $('#question').hide();
        $('#start').show();
        clearInterval(interval);
      }
    }, 1000); // 1000 -> 1초
  },

  showSpinner: function () {
    var target = document.getElementById("spin");
    return new Spinner(opts).spin(target);
  },

  receiveKlay: function () {
    var spinner = this.showSpinner();
    const walletInstance = this.getWallet();

    if (!walletInstance) return;

    agContract.methods.transfer(cav.utils.toPeb("0.1", "KLAY")).send({
      //누가 , gas , value 명시 value는 필요없음 transfer 함수가  payable 아니라서
      from: walletInstance.address,
      gas: '300000',
    }).then(function (receipt) {
      if(receipt.status) {
        spinner.stop();
        alert("0.1 KLAY가 " + walletInstance.address + " 계정으로 지급 되었습니다.");
        $('#transaction').html("");
        $('#transaction')
        .append(`<p><a href='https://baobab.klaytnscope.com/tx/${receipt.transactionHash}'
                    target='_blank'>클레이튼 scope에서 트랜젝션 확인</a></p>`);
        return agContract.methods.getBalance().call()
          .then(function (balance) {
            $('#contractBalance').html("");
            $('#contractBalance')
            .append('<p>' + '이벤트 잔액: ' + cav.utils.fromPeb(balance, "KLAY") + 'KLAY' + '</p>');
          })
                
      }
    })
  }
};

window.App = App;

window.addEventListener("load", function () {
  App.start();
});

var opts = {
  lines: 10, // The number of lines to draw
  length: 30, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#5bc0de', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'absolute' // Element positioning
};