
//check if any new bills
    //curl bill/list -> array of bills
    //compare the database vs the array of bills from request
    //for each of the bills out of date
        //request a single bill data using curl bill/id
        //insert the single bill/id into db along with the status'
    
//check if any new status'
    //curl bill/list ->array
    //check db bills last status vs array last status
    //for each new status pull bill/id
        //insert new status and update last status in bill

        const { exec } = require('child_process');

        // Array of scripts to run
        const scripts = [
          './check-bill.js',
        ];
        
        // Function to execute a script
        function runScript(scriptPath) {
          return new Promise((resolve, reject) => {
            console.log(`Running script: ${scriptPath}`);
            exec(`node ${scriptPath}`, (error, stdout, stderr) => {
              if (error) {
                console.error(`Error running script ${scriptPath}:`, error.message);
                reject(error);
                return;
              }
              console.log(`Output of ${scriptPath}:`);
              console.log(stdout);
              if (stderr) console.error(stderr);
              resolve();
            });
          });
        }
        
        // Run all scripts sequentially
        async function runAllScripts() {
          try {
            for (const script of scripts) {
              await runScript(script);
            }
            console.log("All scripts completed successfully.");
          } catch (err) {
            console.error("Error while running scripts:", err);
          }
        }
        
        // Trigger the execution
        runAllScripts();
        
//TODO
/*2: Ensure the script is executable by adding a shebang line and modifying permissions:

#!/usr/bin/env node
or 
chmod +x cron-runner.js

 */


/* Step 3: Set Up the Cron Job
Edit your cron jobs by running:

crontab -e
30 23 * * * /usr/bin/node /path/to/cron-runner.js >> /path/to/logfile.log 2>&1 


/usr/bin/node: Path to the Node.js binary (use which node to find it on your system).
/path/to/cron-runner.js: Full path to your script.
>> /path/to/logfile.log 2>&1: Redirects both stdout and stderr to a log file for monitoring.
*/

