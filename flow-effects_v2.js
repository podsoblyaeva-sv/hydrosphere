/* Движущиеся направления воды. Разрез грунта показан условно перед сушей. */
window.createWaterFlowEffects = function (THREE, scene, terrainHeight) {
  const groups = Object.fromEntries(['evap','wind','rain','river','under'].map(k => [k,new THREE.Group()]));
  Object.values(groups).forEach(g => scene.add(g));
  const moving = [];
  const up = new THREE.Vector3(0,1,0);
  const shaftGeometry = new THREE.CylinderGeometry(.19,.19,1.8,6);
  const headGeometry = new THREE.ConeGeometry(.65,1.2,6);
  const dropGeometry = new THREE.SphereGeometry(.22,6,5);
  const materials = new Map();
  const material = color => {
    if (!materials.has(color)) materials.set(color,new THREE.MeshBasicMaterial({color}));
    return materials.get(color);
  };
  function arrow(color,scale=1) {
    const g=new THREE.Group();
    const shaft=new THREE.Mesh(shaftGeometry,material(color));shaft.position.y=-.45;
    const head=new THREE.Mesh(headGeometry,material(color));head.position.y=.95;
    g.add(shaft,head);g.scale.setScalar(scale);return g;
  }
  function flow(group,points,{color,count=4,speed=.12,scale=1,drops=0,channel=false}={}) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    if(channel){
      const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,40,.25,6,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5}));
      group.add(tube);
    }
    for(let i=0;i<count+drops;i++){
      const isDrop=i>=count;
      const object=isDrop?new THREE.Mesh(dropGeometry,material(color)):arrow(color,scale);
      if(isDrop)object.scale.set(.8,1.8,.8);
      group.add(object);
      moving.push({object,curve,offset:isDrop?(i-count+.3)/drops:i/count,speed:speed*(isDrop?1.15:1),orient:!isDrop});
    }
  }
  // Испарение: четыре хорошо различимых восходящих потока.
  [[-27,-10],[-22,-2],[-16,7],[-10,13]].forEach(([x,z])=>flow(groups.evap,[[x,1,z],[x+1,9,z],[x+3,19,z]],{color:0xF57C00,count:3,speed:.095,scale:1.05}));
  flow(groups.wind,[[-9,23,-4],[1,25,-4],[13,24,-4]],{color:0x8E44AD,count:4,speed:.085,scale:.85});
  // Дождевые капли заканчивают путь на поверхности склона.
  [[6,-8],[12,-3],[19,4],[9,10]].forEach(([x,z])=>flow(groups.rain,[[x,23,z],[x,17,z],[x,terrainHeight(x,z)+.6,z]],{color:0x075BC7,count:2,drops:8,speed:.24,scale:.8}));
  // Река и три ручья повторяют высоту рельефа, а стрелки текут к океану.
  const riverPaths=[[[25,-4],[21,-3],[17,-1],[12,1],[7,2],[3,1],[-3,0]],[[22,10],[18,8],[14,6],[10,4],[7,2]],[[19,-12],[15,-9],[12,-5],[10,-1],[7,2]],[[12,14],[9,10],[6,6],[3,1]]];
  riverPaths.forEach((points,i)=>flow(groups.river,points.map(([x,z])=>[x,x>0?terrainHeight(x,z)+1.05:.55,z]),{color:0x007EDB,count:i===0?6:3,speed:.1,scale:.85,channel:true,drops:5}));
  // Видимый условный разрез: вода просачивается вниз, затем течёт к океану.
  const section=new THREE.Mesh(new THREE.BoxGeometry(29,7.5,2),new THREE.MeshLambertMaterial({color:0xC99661,transparent:true,opacity:.55,depthWrite:false}));
  section.position.set(13,-3.4,23);groups.under.add(section);
  [7,17,25].forEach((x,i)=>flow(groups.under,[[x,1,24.2],[x-.6,-2.5,24.2],[x-3,-4.6,24.2]],{color:0x004DD1,count:2,drops:3,speed:.16,scale:.66,channel:true}));
  flow(groups.under,[[26,-4.8,24.2],[19,-5.4,24.2],[10,-5,24.2],[2,-4.6,24.2],[-6,-2,23]],{color:0x004DD1,count:7,speed:.09,scale:.8,channel:true,drops:8});
  let time=0;
  const point=new THREE.Vector3(),tangent=new THREE.Vector3();
  function update(delta){
    time+=delta;
    for(const item of moving){
      if(!item.object.parent.visible)continue;
      const t=(time*item.speed+item.offset)%1;
      item.curve.getPointAt(t,point);item.object.position.copy(point);
      if(item.orient){item.curve.getTangentAt(t,tangent);item.object.quaternion.setFromUnitVectors(up,tangent);}
    }
  }
  update(0);
  return {groups,update};
};
