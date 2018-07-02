const path = require('path');
const repolinter = require('repolinter');
const uuidv4 = require('uuid-v4');
const rimraf = require('rimraf');
const fs = require('fs');
const git = require('simple-git')();

var output = null;

async function runRepolinter(git_link, ruleSet){
const tmpDir = await path.resolve('/tmp', uuidv4());
await asyncGitClone(git_link, tmpDir).catch(error => console.error(error));

output = await asyncRunner(tmpDir,ruleSet);
rimraf(tmpDir, function () {});
return output;
}

async function asyncRunner(tmpDir, ruleSet){
 return new Promise(function(resolve,reject){
 	var output = repolinter.lint(tmpDir, [], ruleSet);
 	if (output != null){
 		resolve(output);
 	}
 	else{
 		reject("error")
 	}
 });
}

async function asyncGitClone(git_link, tmpDir){
return new Promise(function(resolve,reject){
	git.clone(git_link, tmpDir, (error) =>{
		 if (!error){
		 	resolve();
    	}
    	else{
    		reject(error);
    	}     
	});
	})
}
 
exports.lintRepo = async (event, context, callback) => {
	process.env.PATH = process.env.LAMBDA_TASK_ROOT + "/bin/usr/bin:" + process.env.PATH;
	process.env.GIT_EXEC_PATH = process.env.LAMBDA_TASK_ROOT + '/bin/usr/libexec/git-core';
    const runningConfig = JSON.parse(event.pathParameters.object);
    try {
        const ret = await runRepolinter(decodeURI(runningConfig.git_link.replace(/([%])/g, "/")), runningConfig.ruleSet);
        let response = {
            'statusCode': 200,
            'headers': {
            "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
            "Access-Control-Allow-Origin": "*"
            },
            'body': JSON.stringify({
                data: ret
            }),
            'method':'POST',
        }
        return response;
    }
    catch (err) {
        callback(err, null);
    }
    callback(null, response);
}
