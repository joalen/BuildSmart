_Note: we need to update this with our actual Software Engineering Document. For now, I'm just leaving instructions for how this project works._

## How to Deploy
1. Make sure you have Python 3.14 installed + Docker Desktop (desktop includes the CLI and is there for troubleshooting)
2. If you are a collaborator, you should've received a .env file that is needed to run this software
3. To check out the development version of BuildSmart, run `npm run dev` in the frontend/ folder and that should spin up the Vite build process + the Docker container responsible for serving the backend logic. 
4. Wait for VITE to show that it is ready in addition to the Container also starting (if first time, you'll need to wait a bit for it to completely install and build)
5. Backend indicates ready if it shows Uvicorn running on localhost (you can press Ctrl + C to stop the entire workflow)

## Project Structure
To ensure that we follow best practices for Git related things, create a branch from master and give an appropriate name for what you want to work on. Once you feel ready, make sure to create a pull request and request someone to review to make sure your logic is sound along with other team members. 

### Frontend
All frontend related work is within the frontend folder and is formatted in this structure: 
```sh
.
├── public
│   └── assets
├── scripts
└── src
    ├── components
    │   └── ui
    ├── hooks
    ├── lib
    └── pages
```

- assets: self-explanatory but shows you all the global images, fonts, and etc for the project that are static in nature and do not need to be dynamically imported or fetched
- scripts: another folder for JS/TS stuff for frontend logic or rendering if we need it
- components: this contains shadcn related materials + custom things that help build out the BuildSmart website. If you need to build things for graphs or whatnot, use this folder to help organize that
- hooks: mainly for save state or loading stuff
- pages: these are the website pages for each of the BuildSmart we need and is based off the wireframes we've discussed.


### Backend
All backend related work is within the backend folder and is formatted in this structure: 
```
.
├── homedepot
└── projectplanner
```

_There are more folders of interest needed to be made but the above serves its purpose below_

- homedepot: this goes to the Home Depot website and spins up a headless browser to help reroute requests and fetch live Home Depot results
- projectplanner: this is the OpenAI ChatGPT wrapper that's there to take in natural queries and spin up structured data for frontend to render and use

## Common Troublehooting and FAQs
Common pitfalls that might happen during development 
1. My code did not update even though I saved
Check to make sure that the docker container is stopped before trying again. Ctrl + C to stop the docker container fully (you might wanna press or spam three times to fully quit). Then, you'll want to run `npm run dev` again

2. My code _still_ did not update even though I saved and did troublehshooting #1
It could be a stale docker cache, for this, you'll want to run `docker compose down --rmi all `. Once the command completes, then you can run `npm run dev`

3. Session boot failed
Frontend will not continue when this error happens.

However, if that happens, it means that the Home Depot API detected unusual activity within the internal navigator. You can run troubleshooting #1 and have that fully restart the backend. This shouldn't happen under normal circumstances but it can be intermittent depending on your environment