(function () {

  const wait = setInterval(() => {

    if (!window.__LIB__?.register)
      return;

    clearInterval(wait);

    window.__LIB__.register("speed", {

      desc: "Velocidad hasta 4x",

      enable() {

        function applySpeed() {

          document
            .querySelectorAll("video")
            .forEach(v => {

              v.playbackRate = 2;

            });

        }

        // aplicar ahora
        applySpeed();

        // aplicar cuando YouTube cambie de video
        const obs = new MutationObserver(
          applySpeed
        );

        obs.observe(
          document.documentElement,
          {
            childList: true,
            subtree: true
          }
        );

        console.log(
          "SPEED ENABLED"
        );

      }

    });

    console.log(
      "REGISTERED: speed"
    );

  }, 100);

})();
