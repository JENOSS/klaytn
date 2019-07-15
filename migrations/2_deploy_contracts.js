//addition_game contract 을 노드에 배포하는 로직
const fs = require('fs') // fs 파일시스템 추가
const AdditionGame = artifacts.require('./AdditionGame.sol')

module.exports = function (deployer) {
  deployer.deploy(AdditionGame)
    .then(()=> {
        if (AdditionGame._json) {
            //어떤 파일에다 어떤 종류를 스트링화해서 넣을 것 이다. (ABI의 정보 문자화해서 저장)
            fs.writeFile('deployedABI',JSON.stringify(AdditionGame._json.abi),
                (err) => {
                    if (err) throw err;
                    console.log("파일에 ABI 입력 성공");
                }
            )
        
            fs.writeFile('deployedAddress', AdditionGame.address,
                (err) => {
                    if (err) throw err;
                    console.log("파일에 주소 입력 성공");
                 }
            )  
        }
    })
}
