//민우 api 개발 파일      http://localhost:8081

const router = require('express').Router()

//크롤링에 사용되는 라이브러리와 모듈 
const axios = require("axios")
const cheerio = require("cheerio")
const moment = require("moment") //날짜 원하는식으로 포맷 위한 라이브러리


// 몽고DB 객체 가져오는 작업. 이 파일에서 db 접근가능하게 하기 위함 ///////////////////////
let connectDB = require('./../database.js') //database.js 파일 경로
const { ObjectId, Int32 } = require('mongodb')

let db
connectDB.then((client)=>{
  console.log('민우 파일 DB연결성공')
  db = client.db('BIC_DB')
}).catch((err)=>{
  console.log(err)
}) 
  
//api ////////////////////////////////////////////////////////////////////////////////////////////


  //몽고db의 액션퀴즈 document 데이터 하나 보내주는 api
  router.get('/action', async (요청, 응답)=>{
    
    //랜덤하게 액션퀴즈 docu 하나 가져오기
    /** @type { { _id : ObjectId, category : string, limited_time : Int32, problem : string, answer : string } }  */
    let result =  await db.collection('action').aggregate([{'$sample': { 'size': 1 } }]).toArray()
   
    응답.json({result : result}) 
  }) 


  
   //깃허브 크롤링해서 커밋했는지 여부 보내주는 api
   router.get('/github/:gitId', async (요청, 응답)=>{

    let lastcommitday = "존재하지 않음"
    let is_committed = false //깃허브 커밋여부 저장 
    let allowDayCount = 2 // 며칠전 깃허브 커밋까지 허용해줄지 선택
    let commitRepo = ""  //최근 커밋한 repo의 이름 저장

    try {
      await axios.get("https://github.com/"+요청.params.gitId+"?tab=repositories")
      .then((response) =>{

         console.log("입력받은 git id:"+요청.params.gitId) 
          const htmlString = response.data
          const $ = cheerio.load(htmlString)
          
          //각 repo들의 commit한 최근 날짜값 가져옴
          const data1 = $('relative-time').text()   //relative-time
          const commitDate = data1.split(new Date().getFullYear()) //올해 년인 2024로 split 진행 
          let today =  moment(new Date()).format("MM-DD")  //오늘 날짜 가져옴
    

          //가장 맨위 repo제목 가져옴
          const data2 = $("*[itemprop = 'name codeRepository']").get(0); //.get(0)은 맨위 repo제목만 가져옴/ .text()하면 모든 repo제목 가져옴
          commitRepo = $(data2).text().trim();
          console.log("commitRepo:"+commitRepo) 

          //commitDate 배열에는 각 올해 커밋한 날짜들만 들어가있음 (최신 커밋날짜만 가져올거면 i=0만 수행하면 되지만 확장가능성 고려하여 다른 날짜값도 가져올 수 있도록 코드작성됨)
          for(let i=0; i<commitDate.length; i++){
            let date = commitDate[i].replace(/,/g, '').trim()  //깃허브에서 가져온 날짜값 포멧을 위한 사전작업
          
            if(date.length<9){ // "Jan 22" 등 이런 포멧형식인것만 처리해주기 위함
              let commitDay = moment(new Date(date)).format("MM-DD")
              
              if(i==0)    //젤 처음에 조회하는 커밋날짜값만 저장해서 프론트에 전달하기 위한 조건문
                lastcommitday =  moment(new Date(commitDay)).format("MM월 DD일")    

              //오늘날짜값과 깃허브 커밋날 차이 비교
              if(compareDate(new Date(today), new Date(commitDay)) <= allowDayCount){
                is_committed = true
                console.log("커밋날로부터 지난일수: "+compareDate(new Date(commitDay), new Date(today)))
              }
              console.log("commitDay: "+commitDay) //02-04 형태의 포멧으로 날짜 변경
            }
          }
  })
    } catch (error) {
      console.log("깃허브 크롤링 에러")
    }
    응답.json({is_committed : is_committed, lastcommitday : lastcommitday, commitRepo : commitRepo})// 커밋여부, 마지막 커밋날짜, 커밋한 repo의 이름 전달
  }) 




//함수 ////////////////////////////////////////////////////////////////////////////////////////////

   //깃허브 크롤링api에서 사용
   //두 날짜 비교하는 함수 - 인자값으로 Date타입이 들어가야함
   const compareDate = (date1, date2) => {
    const oldDate = date1 
    const newDate = date2 
    let diff = Math.abs(newDate.getTime() - oldDate.getTime());
    diff = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return diff  //두 날짜값 차이를 return
  }
  









//이 파일 제일 하단에 router변수 export해줘야 server.js 메인파일에서 이 파일 접근가능
module.exports = router 

// http://localhost:8081/