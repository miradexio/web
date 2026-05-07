export function NightSceneTerrain() {
  return (
    <>
      <rect x="0" y="320" width="1200" height="100" fill="url(#ns-haze)" />
      <g filter="url(#ns-rough-strong)">
        {/* Far mountains — jagged distant range */}
        <path
          d="M 0 398
             L 35 380 L 60 388 L 92 365 L 130 378 L 170 358
             L 210 372 L 250 350 L 282 365 L 320 345
             L 358 360 L 395 348 L 430 372 L 470 358
             L 510 368 L 545 348 L 588 362 L 625 350
             L 670 372 L 712 360 L 750 348 L 790 365
             L 830 352 L 870 372 L 905 360 L 945 350
             L 985 368 L 1025 358 L 1065 372 L 1108 358
             L 1145 368 L 1180 354 L 1200 365
             L 1200 425 L 0 425 Z"
          fill="#1F2540"
          opacity="0.78"
        />
      </g>

      <g filter="url(#ns-rough-strong)">
        {/* Mid mountains — sharper jagged ridge with a few notable peaks */}
        <path
          d="M 0 418
             L 40 402 L 75 412 L 115 390 L 155 408 L 195 388
             L 232 405 L 270 380 L 305 398 L 348 378
             L 385 408 L 420 392 L 455 408 L 498 380
             L 535 405 L 575 388 L 612 410 L 650 388
             L 690 408 L 730 392 L 770 410 L 808 388
             L 845 410 L 885 392 L 925 408 L 965 388
             L 1005 408 L 1045 392 L 1085 410 L 1125 392
             L 1165 408 L 1200 398
             L 1200 440 L 0 440 Z"
          fill="#252B45"
        />
      </g>

      {/* Near mesas — flat-topped (less roughened to keep flatness) */}
      <g filter="url(#ns-rough-subtle)">
        <path
          d="M 0 432
             L 90 432 L 90 418 L 175 418 L 175 432
             L 265 432 L 305 408 L 380 408 L 380 432
             L 460 432 L 460 416 L 540 416 L 540 432
             L 660 432 L 700 412 L 770 412 L 770 432
             L 855 432 L 855 420 L 945 420 L 945 432
             L 1050 432 L 1090 414 L 1170 414 L 1170 432
             L 1200 432 L 1200 460 L 0 460 Z"
          fill="#2C2D48"
        />
      </g>
      {/* Hill layer back — cooler, with shadow base */}
      <g filter="url(#ns-rough-strong)">
        <path
          d="M -20 432
             Q 60 412, 150 428
             Q 230 416, 320 432
             Q 410 414, 500 432
             Q 590 416, 680 432
             Q 770 416, 860 432
             Q 950 416, 1040 432
             Q 1130 418, 1230 430
             L 1230 460 L -20 460 Z"
          fill="#322F4A"
          opacity="0.92"
        />
        <path
          d="M -20 458 Q 600 463, 1230 458 L 1230 462 L -20 462 Z"
          fill="#1F2540"
          opacity="0.55"
        />
      </g>

      {/* Hill layer mid — warmer transition */}
      <g filter="url(#ns-rough-strong)">
        <path
          d="M -20 456
             Q 80 434, 190 454
             Q 290 440, 400 458
             Q 510 442, 620 458
             Q 720 442, 830 458
             Q 940 442, 1050 458
             Q 1140 446, 1230 456
             L 1230 488 L -20 488 Z"
          fill="#473F50"
          opacity="0.85"
        />
        <path
          d="M -20 486 Q 600 491, 1230 486 L 1230 490 L -20 490 Z"
          fill="#2A2842"
          opacity="0.45"
        />
      </g>
    </>
  );
}
