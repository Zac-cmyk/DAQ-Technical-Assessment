# Brainstorming

This file is used to document your thoughts, approaches and research conducted across all tasks in the Technical Assessment.

## Firmware

## Spyder

I started off with Spyder as I am most familiar with back-end and front-end applications. 

My first step was to set-up everything which was forking the repository and then cloning it to my system. I installed all the packages in the system using npm i and cd'ing into each respective directory. I installed docker onto my system as well to run the emulator. I faced some difficulties running this as the installer wouldn't install docker properly so I had to use some round-about methods. 

After set-up I read the instructions from the README.md and explored each directory to understand the tech-stack of the whole project. My understanding is that the backend runs off a node.js service that recieves data from the emulator and sends it to the frontend via a WebSocket. The frontend runs off NextJs with React and Tailwind CSS for styling. Parts of the frontend and backend have been completed so I just have to finish off the tasks given to me.

Thus, after understanding the project's tech stack I decided to follow the tasks in sequential order. Starting with the backend. The first task was to deal with the client recieving values in the incorrect format. 

1 - My thought process for (1) was to determine what would be considered as values with 'incorrect format'. When I would run 'dock compose up' I noticed the invalid string for the battery_temperature would be passed as "?\u0001\u0000\u0000", on the frontend it would show up as a ☒ or # or even letters such as 'S', 'E", but this was clearly the invalid format the client would recieve occasionaly.

So my thought was to implement some sort of functionality that would filter out these invalid strings and not have them printed on the frontend. Mainly a function that would check for the correct data type. 

I wrote this function known as ValidateData() on the a separate file called app.ts and then exported and imported it into server.ts. This was just to keep server/client functionality separate from the extra functions being added (more neat and clean). I was thinking ahead as well just incase there were any other helper functions needed to be added to app.ts. 

How I validated the Vehicle's data or more specifically the battery temperature was that I did simple checks, I first checked if the VehicleData being passed through the function was an object, and then if any of the variables existed (if they were undefined or not). Once it was confirmed that the battery temp existed I then checked if it was not a number (NaN). If it wasnt a number I would return false, else if it was a number but it wasn't a realistic temperature (I just kind of estimated between the range of -20 to 150 degrees) then it would also return false. If it checks was passed the function would return true.

In server.ts I imported the ValidateData() function and js added it as an if statement when the server sends the JSON data to the frontend. To check the data the server recieves from the client I first parse the string into a JSON object (vehicleData) and then re-stringify the vehicleData if it has been succesfully validated. If the data is invalid nothing is sent to the frontend. Console log messages are outputted to check whether data is invalid or valid in the console log. 

2 - For (2) To check if the battery temp is within a given safe operating range (20-80 degrees) I am going to make another function named checkBatterySafety(). This will check if the battery temperature is out of the safety range more than three times in 5 seconds. 

The logic of the checkBatterySafety() function involves constantly checking if the temperature is less than the safeMin of 20 or the more than the safeMax of 80. If it is then the timestamp of the temperature is pushed to an array. For any temperature timestamps that are older than 5 seconds they are removed from the array. If the array exceeds a length of 3 it means that in the span of 5 seconds 3 battery temperatures of the vehicle is outside of the safe operation range. 

I also removed the range checker (-20 - 150) in the ValidateData() function as it was not specified in the question to do that. It also means that for the checkBatterySafety it will check higher and lower temperatures now. This made me see more of the BATTERY SAFETY ALERT on the console log during dock compose up since temperatures outside the range of (-20 to 150) is being validated and then checked by the checkBatterySafety() function.

Old code I had in ValidateData() for reference:

const min = -20;
const max = 150;

if (temp < min || temp > max) {
    return false;
}

For the server.ts for (2) I just added a line of code where it called the function from app.ts passing in the appropriate variables (battery_temperature, timestamp). 

3 - Immediately my thought process for why the connect/disconnect button in the top right corner of the UI (frontend) did not update when data is streamed in via streaming service was that there was some issue with the React code in the frontend. After looking into the page.tsx file where the connect button is located I searched for any synchronisation issues. I came to the conclusion that it must be an issue with the effect hook created to handle the WebSocket connection state changes. The WebSocket connection must be independent and managed separately by the browser's WebSocket API, not react. Additionally I noticed in the useEffect hook there is an empty dependency arrray ([]). This means it will run only once, when the component first mounts. This is why the readyState is always set to ReadyState.CONNECTING as it runs once setting it to 'Connecting' and then never runs again. The ready state needs to change over time from CONNECTING -> OPEN -> CLOSED (based off the cases seen in the useEffect). However, the useEffect is not listening for any changes because it has no dependencies. 

To rectify this issue all that is needed is to add 'readyState' to the dependency array. 

4 - There is four sections I added or changed to the frontend UI. For the first one I kept the live temperature tracker and renamed it to 'Battery Temperature Monitoring', which in my opinion was a better naming convention. I also made the live data coming in change colours according to the if the temperature is safe (25-75), Warning (nearing unsafe 20-25 or 75-80), and then Critical (unsafe <20, >80), the colours were green, yellow and red respectively. The colours were calculated by using a helper function which would look at the value of the temp sent from the backend and then depending on the value it would return the tailwind css for that respective colour. These functions were called in the respective divs when assigning colour to the live temperature value and temperature scale bar. I added the bar for a small visual representation of where the temperature is within the safe opertaional range. The width of the bar is calculated by finding the current temperature percentage to the range (minTemp, maxTemp) which is set to (20, 80) respectively using useStat(): 

const [maxTemp, setMaxTemp] = useState<number>(80)
const [minTemp, setMinTemp] = useState<number>(20)

const tempPercentage = Math.max(0, Math.min(100, ((temperature - minTemp) / (maxTemp - minTemp)) * 100))

The second feature or section that I added is a 'System status' section. This section was originally going to be the temperature history section but I felt like I wanted to add more visual feedback so I added how many data points are in the connection list (stops at a max of 50 data points). The Update Rate is just a fixed value but I thought it would be cool to see the speed of the system as well as the connection status. I utilise a useEffect() hook to add the vehicleData to a history array that I call in the System Status card to display a list of temperature's history. 

The third feature I added is the temperature statistics. This is just mainly the current statistic, maximum, minimum and average. I added this so that the user could see when the battery temperature peaks and drops. This was fairly simple to make as it was just another card section where the card labels for current temperature was calculated by using the Temperature passed to the frontend, the max and min was calculated by seeing if the max value has changed in the history array and the minimum value as well. The average was also calculated using the history array. I styled each label with a nice border and colourful text to add to the visuals. 

The last feature I added was the Battery Health & Safety card. This essentially was just another bar that showed a percentage of the Battery Health if it was exceeding the safe operational limit or dropping under it. I just used the same logic aas the temperature scale but visually added the temperature perecentage as a visual with the 20-80 degrees as a start and end point on the bar. For the Safety Alerts I had to alter app.ts and servet.ts to implement sending the error message from my checkBatterySafety() funciton if an alert message was returned, I used the same logic you guys implemented to send the JSON data to the frontend. In the frontend I made a useStatus for the Safety Alerts and then assigned the messages that would contain the alert messages if it didnt then the useStatus for setting alert messages would not be called. I then just added the alerts in a scrollable list where the most recent alert appears at the top so the user does not have to scroll all the way to the bottom to see the most recent alert. Only 20 active alerts can be seen at a time. 

Honorable mention is that I tried to install recharts to make a line graph to visually track the increase and decrease of the Vehicle's temperature. However for some reason the installation never worked even when I ran 'docker compose up --build'. Was running low on time though so I just made do with the statistics section. 



## Cloud

This section required me to propose a change or an addition that would allow data (from the proposed weather system) to be integrated into the Redback CLoud System. DAQ uses Amazon Web Services (AWS) to deploy and run their systems, this is a service that I am very unfamiliar with so the first stages of this was a lot of self research into AWS. The Cloud Architectural Diagram helped a lot as a reference to see the process going on in the system. 

I started by making the PDF document which will contain the diagram and how to implement the system. Reasoning for the implementation can be found in the PDF document. 

For the diagram, I started off by researching a good starting point learning about AWS IoT or just mainly ingestion services (entry points where external data firsts enters the cloud systerm). I learn that they are important for security, scalability, protocol handling and reliability. Mainly for authenticating data sources and ensuring no data is lost. Apparently AWS IoT Core acts as a secure ingestion layer that the weather system can pass data to so I will use AWS Iot Core as an ingestion layer.

The next part of the system to add according to my reseach was a storage pipeline to store data in the cloud after passing data into the cloud system for authentication. 

I settled on using an IoT -> lambda -> redis storage path since Lambda is a serverless compute function that reacts to events. This means that when the weather station sendsdata -> IoT (authenticates) -> triggers lambda function, lambda will then transopfrm the data and then forward it to the Redis. I choose redis as it will act as the real-time data layer recieving constant weather updates from the weather system. By pushing weather data to the Redis channel, the frontend dashboard can show both car and weather data in realtime. However I realised for long-term storage the data would have to be transferred out of redis to a different storage. To store the historical logs and cold data the history of the weather system will be relayed into the S3 database. So realtime data is shown in the Redis Channel and then the S3 database will store the historical logs. After that you can even add DynamoDB for structured queries. 

That mainly setups the cloud arhcitecture system for the Weather System. The rest of the documentation can be found on the PDF. I did some more research to justify my consideration for the use of terraform and docker in the implementation for the weather system. 