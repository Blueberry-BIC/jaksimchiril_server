// 수빈 api 개발 파일

//express라이브러리 가져옴
// 몽고DB 객체 가져오는 작업. 이 파일에서 db 접근가능하게 하기 위함 ///////////////////////
const router = require('express').Router()
const { ObjectId } = require('mongodb')
let connectDB = require('./../database.js') //database.js 파일 경로

let db
connectDB.then((client)=>{
  console.log('수빈 파일 DB연결성공')
  db = client.db('BIC_DB')
  settlePrize(account)
}).catch((err)=>{
  console.log(err)
}) 
//////////////////////////////////////////////


//api ////////////////////////////////////////////////////////////////////////////////////////////

  //관리자 지갑 주소 가져오는 api
  router.get('/admin_wallet', async (req, res)=>{
    
    /** @type { wallet_addr : string }  */
    console.log("get wallet address")
    let result =  await db.collection('admin_wallet').find({}).toArray()
    const walletdata = result[0].wallet_addr; // string
    console.log(walletdata)

    res.json({
      walletAddr: walletdata
    })
  })

  // 참가하기 눌렀을 때 activated_chall collection 업데이트하는 api
  router.put('/participate/:chall_id', async (req, res)=> {
    console.log("PUT user_list")
    const challId = req.params.chall_id
    //console.log(req.body)
    let msg = ""

    var usernum = req.body.userNum
    var userlist = req.body.userList

    try {
      let result = await db.collection('activated_chall').updateOne({_id: new ObjectId(challId)}, {$set: {user_list: userlist, user_num: usernum}})
      msg = "챌린지 참여 완료되었습니다."
    } catch (err) {
      console.log(`ERROR: ${err}`)
    }

    res.json({
      data: msg
    })

  })

  //참가하기 눌렀을 때 user collection 업데이트하는 api
  router.patch('/participate/:user_id', async (req, res)=>{
    console.log("PATCH progress_chall")
    const userId = req.params.user_id
    //console.log(req.body)
    let result = await db.collection('user').findOne({_id: new ObjectId(userId)})
    let progresschall = result.progress_chall
    let msg = ""

    if (progresschall.includes(req.body.data, 0) == false){
      if (progresschall[0] == ""){
        progresschall[0] = req.body.data
      }
      else {
        progresschall.push(req.body.data)
      }
      try {
        let result2 = await db.collection('user').updateOne({_id: new ObjectId(userId)}, {$set: {progress_chall: progresschall}})
        msg = "챌린지 참여 완료되었습니다."
      } catch (err) {
        console.log(`ERROR: ${err}`)
      }
    }
    else{
      console.log("이미 존재하는 챌린지")
      msg = "이미 존재하는 챌린지입니다"
    }

    //console.log(progresschall)
    res.json({
      data: msg
    })
  })


///////////////klaytn 관련 함수////////////////////////////////////////////
//connect klaytn
const Caver = require('caver-js')
const read = require('read')
const caver = new Caver('https://public-en-baobab.klaytn.net/')

// admin info
// 여기 추가

const keyring = new caver.wallet.keyring.singleKeyring(account, key)
caver.wallet.add(keyring)

  // 특정 지갑잔액 보는 함수
  async function viewbalance(account){
    const balance = await caver.klay.getBalance(account)
    console.log(`account: ${account}`)
    console.log(`balance: ${balance}`)
  }

  //klay 전송 함수
  async function sendKlay(from, to, money){
    const vt = caver.transaction.valueTransfer.create({
      from: keyring.address,
      to:to,
      value: caver.utils.toPeb(money, 'KLAY'),
      gas: 25000
    })

    const signed = await caver.wallet.sign(keyring.address, vt)
    const receipt = await caver.rpc.klay.sendRawTransaction(signed)
    console.log(receipt)
  }

  
  async function settlePrize(from){
    console.log("get completed chall info")
    let result =  await db.collection('completed_chall').find({check_prize: false}).toArray()

    for (i in result){
      var cnt = result[i].total_days  //인증 성공 기준 횟수
      var success_users = result[i].user_list  //성공한 참가자 id 리스트
      var chk_success = result[i].is_success  //각 참가자별 성공 여부 리스트
      var fee = result[i].money  //해당 챌린지의 1인당 참가비
      var challMoney = fee * success_users.length  //해당 챌린지에 모인 총 금액
      var recv_money = 0  //각 참가자별 받아야할 금액
      var prize = 0  // 상금
      console.log(`fee=${fee}, challMoney=${challMoney}`)

      for (j in chk_success){
        console.log(chk_success[j])
        if (chk_success[j] != cnt){
            //바로 백분율 계산 -> 정산
            console.log('실패한 사람')
            let user = await db.collection('user').findOne({_id: new ObjectId(success_users[j])})

            recv_money = (chk_success[j]/cnt)*fee
            console.log(typeof(user.wallet_addr), String(recv_money))
            const res = await sendKlay(from, user.wallet_addr, String(recv_money))

            challMoney = challMoney - recv_money
            success_users.splice(j, 1)
            console.log(`challmoney : ${challMoney}, success_users: ${success_users}`)
        }
      }
      prize = challMoney / success_users.length
      console.log(`prize = ${prize}`)

      for (j in success_users){
        console.log(`성공한 사람: ${j}`)
        let suser = await db.collection('user').findOne({_id: new ObjectId(success_users[j])})
        const res = await sendKlay(from, suser.wallet_addr, String(prize))

        //성공한 참가자 document update
        let newprize = parseInt(suser.prize_money, 10) + prize
        let newsuser = await db.collection('user').updateOne({_id: new ObjectId(success_users[j])}, {$set: {prize_money: String(newprize)}})
      }
      //chall document update
      let newcheck = await db.collection('completed_chall').updateOne({_id: new ObjectId(result[i]._id)}, {$set: {check_prize: true}})
    }
  }

//이 파일 제일 하단에 router변수 export해줘야 server.js 메인파일에서 이 파일 접근가능
module.exports = router 