import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const $ = (s) => document.querySelector(s);
const canvas=$("#world"), status=$("#status"), audio=$("#narration");
const line=$("#line"), subline=$("#subline"), timeline=$("#timeline"), clock=$("#clock");
const playButton=$("#play"), speedSelect=$("#speed");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x101923);
scene.fog=new THREE.FogExp2(0x101923,.018);
const camera=new THREE.PerspectiveCamera(42,1,.1,300);
scene.add(new THREE.HemisphereLight(0x9db5d0,0x29231f,1.5));
const moon=new THREE.DirectionalLight(0xb2c9e8,2.2);moon.position.set(-12,22,10);scene.add(moon);
const loader=new GLTFLoader();
const clock3d=new THREE.Clock();
const actors=new Map(), mixers=[], clips=new Map();
let episode=null,duration=0,lastScene=-1,playing=false,scrubbing=false;

function resize(){
 const w=canvas.clientWidth||640,h=canvas.clientHeight||640;
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);resize();

function fmt(t){const m=Math.floor(t/60),s=Math.floor(t%60);return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")}
function setStatus(msg){status.textContent=msg}
function makePlaceholder(id,color){
 const group=new THREE.Group();
 const material=new THREE.MeshStandardMaterial({color,roughness:.82});
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.78,5,10),material);body.position.y=1.25;group.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.29,20,16),new THREE.MeshStandardMaterial({color:0xb98270}));head.position.y=2.15;group.add(head);
 const marker=new THREE.Mesh(new THREE.BoxGeometry(.16,.16,.16),new THREE.MeshStandardMaterial({color:0xd5c0a2}));marker.position.y=2.55;group.add(marker);
 group.userData.placeholder=true;group.userData.actorId=id;scene.add(group);return group;
}
async function loadModel(url){
 const gltf=await loader.loadAsync(url);
 gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
 scene.add(gltf.scene);
 if(gltf.animations?.length){const mixer=new THREE.AnimationMixer(gltf.scene);mixers.push(mixer);gltf.animations.forEach(clip=>clips.set(clip.name,{mixer,clip}));}
 return gltf.scene;
}
async function loadActors(defs){
 const palette={zio:0x45566a,erla:0x66545a,olaf:0x77717d,den:0x343a45};
 for(const def of defs||[]){
  try{
   const model=await loadModel(def.model);
   model.name=def.id;actors.set(def.id,model);
   if(def.position)model.position.set(...def.position);
  }catch(err){
   const fallback=makePlaceholder(def.id,palette[def.id]||0x58616c);
   actors.set(def.id,fallback);
   console.warn("Model belum tersedia:",def.id,err);
  }
 }
}
function playAction(actorId,actionName){
 const actor=actors.get(actorId);if(!actor)return;
 const action=clips.get(actionName);
 if(action){action.mixer.clipAction(action.clip).reset().fadeIn(.18).play();return}
 // Placeholder movement is intentionally only a temporary visual cue.
 actor.userData.currentAction=actionName;
}
function cameraTo(def){
 if(!def)return;
 const p=def.position||[0,4,10],look=def.lookAt||[0,1,0];
 camera.position.set(...p);camera.lookAt(...look);
 if(def.fov){camera.fov=def.fov;camera.updateProjectionMatrix()}
}
function activeScene(t){
 return (episode?.scenes||[]).findIndex(s=>t>=s.start&&t<s.end);
}
function renderTime(t){
 if(!episode)return;
 const idx=activeScene(t),s=episode.scenes[Math.max(0,idx)]||episode.scenes.at(-1);
 if(!s)return;
 if(idx!==lastScene){
  lastScene=idx;
  cameraTo(s.camera);
  (s.actors||[]).forEach(a=>playAction(a.id,a.action));
 }
 line.textContent=s.caption||"";
 subline.textContent=s.dialogue||"";
}
function tick(){
 requestAnimationFrame(tick);
 const dt=Math.min(clock3d.getDelta(),.05);
 mixers.forEach(m=>m.update(dt));
 if(playing&&!audio.paused)renderTime(audio.currentTime);
 renderer.render(scene,camera);
}
function syncUI(){
 const t=audio.currentTime||0;
 timeline.value=String(t);clock.textContent=fmt(t)+" / "+fmt(duration);
 renderTime(t);
}
async function loadEpisode(){
 const response=await fetch("./episodes/ep01/episode.json");
 if(!response.ok)throw new Error("episode.json tidak ditemukan");
 episode=await response.json();
 $("#episodeTitle").textContent=episode.title||"3D PIPELINE PREVIEW";
 audio.src=episode.audio||"";
 await loadActors(episode.characters);
 duration=Number(episode.duration)||0;
 audio.addEventListener("loadedmetadata",()=>{duration=audio.duration||duration;timeline.max=String(duration);syncUI()});
 timeline.max=String(duration||1);
 setStatus("Engine siap · "+actors.size+" karakter terdaftar");
 renderTime(0);
}
playButton.addEventListener("click",async()=>{
 if(!audio.src){setStatus("Audio episode belum dipasang.");return}
 if(audio.paused){await audio.play();playing=true;playButton.textContent="Jeda"}
 else{audio.pause();playing=false;playButton.textContent="Putar"}
});
$("#restart").addEventListener("click",()=>{audio.pause();audio.currentTime=0;playing=false;playButton.textContent="Putar";syncUI()});
speedSelect.addEventListener("change",()=>{audio.playbackRate=Number(speedSelect.value)||1});
timeline.addEventListener("input",()=>{scrubbing=true;audio.currentTime=Number(timeline.value);syncUI()});
timeline.addEventListener("change",()=>{scrubbing=false;audio.currentTime=Number(timeline.value);syncUI()});
audio.addEventListener("timeupdate",()=>{if(!scrubbing)syncUI()});
audio.addEventListener("seeked",syncUI);
audio.addEventListener("ended",()=>{playing=false;playButton.textContent="Putar";syncUI()});
loadEpisode().catch(err=>{console.error(err);setStatus("Gagal memuat konfigurasi: "+err.message)});
tick();