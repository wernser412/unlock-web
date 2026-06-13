window.__LIB__.register("speed", {

  desc: "Velocidad hasta 4x",

  enable() {

    document.querySelectorAll("video").forEach(v => {

      v.playbackRate = 2;

    });

    console.log("SPEED ENABLED");

  }

});
