import fs  from 'fs';
import { google } from 'googleapis';

const apikeys = {
    
  }

const SCOPE = ['https://www.googleapis.com/auth/drive'];

// A Function that can provide access to google drive api
async function authorize(){
    const jwtClient = new google.auth.JWT(
        apikeys.client_email,
        null,
        apikeys.private_key,
        SCOPE
    );

    await jwtClient.authorize();

    return jwtClient;
}

async function uploadFile(authClient){
    return new Promise((resolve,rejected)=>{
        const drive = google.drive({version:'v3',auth:authClient}); 

        var fileMetaData = {
            name:'recording.mp4',
            parents:['1RElVr1Jp-tin2SDSOIn1s7GC6lu_PB1U'] // A folder ID to which file will get uploaded
        }

        drive.files.create({
            resource:fileMetaData,
            media:{
                body: fs.createReadStream('recording.mp4'), // files that will get uploaded
                mimeType:'video/mp4'
            },
            fields:'id'
        },function(error,file){
            if(error){
                return rejected(error)
            }
            resolve(file);
        })
    });
}




authorize().then(uploadFile).catch("error",console.error()); // function call