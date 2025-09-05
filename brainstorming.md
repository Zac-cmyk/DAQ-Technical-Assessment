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

The second feature or section that I added is a 'System status' section. 


## Cloud