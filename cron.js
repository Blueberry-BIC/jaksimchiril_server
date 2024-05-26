// 스케줄링 작업 수행을 위해 필요한 모듈
// npm i node-schedule 먼저 필요
const schedule = require('node-schedule')

// 몽고DB 객체 가져오는 작업. 이 파일에서 db 접근가능하게 하기 위함 ///////////////////////
let connectDB = require('./database.js') //database.js 파일 경로
const { ObjectId, Int32 } = require('mongodb')

let db
connectDB.then((client)=>{
  console.log('cron 파일 DB연결성공')
  db = client.db('BIC_DB')
}).catch((err)=>{
  console.log(err)
}) 

const job = schedule.scheduleJob('0 0 0 * * *', ()=>{
    settlePrize(account)
    let today = moment().format()
    console.log("start everyday format")
    moveCompletedChall(today)
    changeIsProgress(today)
    changeCertifyStatus()
})




///////////////klaytn 관련 함수////////////////////////////////////////////
//connect klaytn
const Caver = require('caver-js')
const read = require('read')
const moment = require('moment')
const caver = new Caver('https://public-en-baobab.klaytn.net/')

// admin info
// 여기 추가
const account = "0x05Ed1eb522A63D15b533D48AeDAbcF074105BB48" // admin
const key = "0x1e624b48a0ff4663af882766d6c605b7e26db9da9a095a6bc2623fcbe29f481a"

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
      var success_users = result[i].user_list  //성공한 참가자 id 리스트
      if (success_users == null || success_users[0] == ""){
        console.log("유저 없음 X")
        continue
      }
      var cnt = result[i].total_days  //인증 성공 기준 횟수
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
            if (user){
              recv_money = (chk_success[j]/cnt)*fee
              console.log(typeof(user.wallet_addr), String(recv_money))
              const res = await sendKlay(from, user.wallet_addr, String(recv_money))

              challMoney = challMoney - recv_money
              success_users.splice(j, 1)
              console.log(`challmoney : ${challMoney}, success_users: ${success_users}`)
            }
            else{
              console.log("존재하지 않는 유저입니다")
            }
        }
      }
      prize = challMoney / success_users.length
      console.log(`prize = ${prize}`)

      for (j in success_users){
        console.log(`성공한 사람: ${j}, ${success_users[j]}`)
        let suser = await db.collection('user').findOne({_id: new ObjectId(success_users[j])})
        if (suser){
          const res = await sendKlay(from, suser.wallet_addr, String(prize))

          //성공한 참가자 document update
          let newprize = parseInt(suser.prize_money, 10) + prize
          console.log(newprize)
          let newsuser = await db.collection('user').updateOne({_id: new ObjectId(success_users[j])}, {$set: {prize_money: String(newprize)}})
        }
        else{
          console.log("존재하지 않는 유저입니다")
        }
        }
      //chall document update
      let newcheck = await db.collection('completed_chall').updateOne({_id: new ObjectId(result[i]._id)}, {$set: {check_prize: true}})
    }
  }



///////////////챌린지 종료 관련 함수////////////////////////////////////////////
// 종료된 챌린지 체크 후 db 옮기기
  async function moveCompletedChall(today){
    console.log('[1]종료된 챌린지 체크 후 db 옮기기')
    console.log(`today=${today}, ${typeof(today)}`)
    var challList = new Array()
    var userdict = {}

    try {
      var targets = await db.collection('activated_chall').find({end_date: {$lte:new Date(today)}}).toArray()
      console.log(targets)
      
      for (const chall of targets){
        var completed = {
          _id: chall._id,
          chall_name: chall.chall_name,
          start_date: chall.start_date,
          end_date: chall.end_date,
          auth_method: chall.auth_method,
          chall_desc : chall.chall_desc,
          is_public : chall.is_public,
          category : chall.category,
          passwd : chall.passwd,
          user_num : chall.user_num,
          user_list : chall.user_list,
          is_success : chall.is_success,
          total_days : chall.total_days,
          check_prize : false,
          money : chall.money
        }
        challList.push(completed)
        var uinfo = [chall.user_list, chall.auth_method]
        userdict[String(chall._id)] = uinfo
        //console.log(`chllid=${chall._id}, uinfo=${uinfo}, userdict=${userdict}`)
      
      }

      if (challList.length > 0){
        const options = { ordered: true };
        let res2 = db.collection('completed_chall').insertMany(challList, options)
      }
      else{
        console.log("there is no completed chall")
      }
    } catch (error) {
      console.log(error)
    }
    // update users & delete from activatedchall
    if (Object.keys(userdict).length > 0){
      try{
        updateCompletedUsers(userdict)
        deleteActivated(userdict)
      }
      catch(e){
        console.log(e)
      }
    }
  }
  
  //종료된 챌린지 참여했던 user의 progress chall과 stack 정보 업데이트
  function updateCompletedUsers(userdict){
    console.log("[2]update completed users")
    try {
      for (const [key, value] of Object.entries(userdict)){
        if (value[0] == null){
          console.log(`key=${key}, there is no user`)
          continue
        }
        var userlist = value[0]
        var auth = value[1]
        const category = {1:"stack3", 2:"stack1", 3:"stack4", 4:"stack3", 5:"stack2"}
        let stack = category[auth]

        for (const u of userlist){
          let res = db.collection('user').updateOne({_id:new ObjectId(u)}, {"$push": {[stack]: key}, "$pull":{"progress_chall":key}})
          //console.log(`key=${key}`)
        }
        console.log(`key=${key}, update users`)
      }
    } catch(e){
      console.log(e)
    }
  }

  // 끝난 챌린지 activated chall에서 삭제
  async function deleteActivated(userdict){
    console.log("[3]delete from activatedchall")
    for (const key of Object.keys(userdict)){
      let delchall = await db.collection('activated_chall').deleteOne({_id: new ObjectId(key)})
      console.log(`delete chall : ${delchall}`)
    } 
  }



  ///////////////인증 초기화 관련 함수////////////////////////////////////////////
  // 진행중인 챌린지의 유저 하루 인증여부 모두 false로 초기화
  async function changeCertifyStatus(){
    console.log("start change all user's certify status to false")
    const projection = { _id: 1, user_list:1 };
    let res = await db.collection('activated_chall').find({$nor:[{user_list:null}, {user_list:""}]}).project(projection).toArray()
    for (i in res){
      console.log(res[i])
      var userlist = res[i].user_list
      for (userid of userlist){
        let res2 = db.collection('activated_chall').updateOne({_id: new ObjectId(res[i]._id)}, {$set: {[`${userid}.1`]: false}})
      }
    }
    console.log("finish change all user false")

  }

  ///////////////챌린지 진행 관련 함수////////////////////////////////////////////
  // 챌린지 시작 기간 확인 후 is_progress 변경
  async function changeIsProgress(today){
    console.log("check start data of challenges")
    let res = await db.collection('activated_chall').updateMany({start_date: {$lte:new Date(today)}}, {$set: {is_progress:1}})
    console.log("finish changeIsProgress")
  }
  