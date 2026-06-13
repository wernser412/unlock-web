window.__LIB__.register("speed", {

  desc: "Velocidad hasta 4x",

  enable() {

    let slider = null;

    let label = null;

    const SPEED_KEY =
      "lib_speed";


    async function addSpeedSlider() {

      const controls =
        document.querySelector(
          ".ytp-right-controls"
        );

      if (
        !controls ||
        document.getElementById(
          "vh-speed"
        )
      )
        return;


      const container =
        document.createElement(
          "div"
        );

      container.id =
        "vh-speed";

      container.style.cssText = `

        display:flex;

        align-items:center;

        gap:6px;

        margin-right:10px;

      `;


      const saved =
        await GM_getValue(
          SPEED_KEY,
          1
        );


      label =
        document.createElement(
          "span"
        );

      label.textContent =
        saved.toFixed(2) +
        "x";

      label.style.cssText = `

        color:#00ff99;

        font-size:12px;

        min-width:40px;

        text-align:center;

      `;


      slider =
        document.createElement(
          "input"
        );

      slider.type =
        "range";

      slider.min =
        0.25;

      slider.max =
        4;

      slider.step =
        0.25;

      slider.value =
        saved;

      slider.style.width =
        "90px";


      slider.oninput =
        async () => {

        const videos =
          document.querySelectorAll(
            "video"
          );

        videos.forEach(v => {

          v.playbackRate =
            Number(
              slider.value
            );

        });

        label.textContent =
          Number(
            slider.value
          ).toFixed(2) +
          "x";

        await GM_setValue(

          SPEED_KEY,

          Number(
            slider.value
          )

        );

      };


      container.appendChild(
        label
      );

      container.appendChild(
        slider
      );

      controls.prepend(
        container
      );


      /*
       Restaurar velocidad
      */

      document

        .querySelectorAll(
          "video"
        )

        .forEach(v => {

          v.playbackRate =
            saved;

        });

    }



    /*
     Detectar cambios de video
    */

    setInterval(
      async () => {

      addSpeedSlider();


      const saved =
        await GM_getValue(

          SPEED_KEY,

          1

        );


      document

        .querySelectorAll(
          "video"
        )

        .forEach(v => {

          if (

            v.playbackRate !==

            saved

          ) {

            v.playbackRate =

              saved;

          }

        });

    }, 1000);

  }

});