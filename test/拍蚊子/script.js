var swatter = document.querySelector(".swatter");
window.addEventListener("mousemove", onMove);
window.addEventListener("mouseout", onMouseOut);
window.addEventListener("mouseover", onMouseOver);

function onMove(e) {
    TweenMax.set(".swatter-container", {
        x: e.pageX,
        y: e.pageY
    });
}

function onMouseOut(e) {
    TweenMax.to(".swatter", 0.1, {
        autoAlpha: 0
    });
}

function onMouseOver(e) {
    TweenMax.to(".swatter", 0.1, {
        autoAlpha: 1
    });
}

function swat(e) {
    TweenMax.to(".swatter", .05, {
        rotationX: -55,
        transformOrigin: "0% 110%",
        yoyo: true,
        repeat: 1,
        ease: Quint.easeOut
    });
    checkPoint(e.clientX,e.clientY);
}

window.addEventListener("mousedown", swat);
window.addEventListener("touchstart", swat);
var index = 0;
var gnatTemplate = document.querySelector(".gnat");
var enemies = document.querySelector(".enemies");
var gnats = [];
var swatThreshold = 45;
var swatCount = 0;

function getPath() {
	var numPoints = 8;
	var angle = 0;
	var initX = Math.random() < 0.5 ? -20 : window.innerWidth + 20;
	var initY = Math.random() < 0.5 ? -20 : window.innerHeight + 20
	var points = [{
		x: initX,
		y: initY
        }];

	for (var i = 0; i < numPoints; i++) {
		angle = Math.random() * Math.PI * 2;
		var x = (Math.cos(angle) * window.innerWidth * .3) + window.innerWidth * .5;
		var y = (Math.sin(angle) * window.innerHeight * .3) + window.innerHeight * .5;
		points.push({
			x: x,
			y: y
		});
	}
	points.push({
		x: Math.random() < 0.5 ? -20 : window.innerWidth + 20,
		y: Math.random() < 0.5 ? -20 : window.innerHeight + 20
	})
	return points;
}

function buzz(gnatObject) {
	if (gnatObject) {
		var gnatElement = gnatObject.element;
		var flap = Math.random();
		TweenMax.set(gnatElement.querySelector(".wing1"), {
			autoAlpha: flap > 0.5 ? 0 : 1
		});
		TweenMax.set(gnatElement.querySelector(".wing2"), {
			autoAlpha: flap > 0.5 ? 1 : 0
		});
		TweenMax.set(gnatElement, {
			x: gnatObject.x,
			y: gnatObject.y
		});
	}

}

function createGnats(numGnats) {
	var path = getPath();
	var bugGroup = [];
	for (var i = 0; i < numGnats; i++) {
		var gnat = gnatTemplate.cloneNode(true);
		enemies.appendChild(gnat);
		var gnatObject = {
			element: gnat,
			x: path[0].x,
			y: path[0].y,
			alive:true
		};
		gnats.push(gnatObject);
		bugGroup.push(gnatObject);
		TweenMax.set(gnat, {
			x: path[0].x,
			y: path[0].y,
			transformOrigin: "50% 50%"
		})
		index++;
		TweenMax.to(gnatObject, 7, {
			delay: i * .2,
			bezier: {
				type: "thru",
				values: path,
				curviness: 1.5,
			},
			ease: Linear.easeNone,
			onUpdate: buzz,
			onUpdateParams: [gnatObject],
			onComplete: removeGnat,
			onCompleteParams: [gnatObject]
		});
	}
}

function removeGnat(gnatObject) {
	if (gnatObject) {
		TweenMax.killTweensOf(gnatObject);
		TweenMax.killTweensOf(gnatObject.element);
		TweenMax.killChildTweensOf(gnatObject.element);
		enemies.removeChild(gnatObject.element);
		gnatObject = null;
	}
}

function emitGnats() {
	createGnats(parseInt(Math.random() * 2) + 3);
	TweenMax.delayedCall((Math.random()) + 2, emitGnats);
}

function deleteElement(element) {
	enemies.removeChild(element);
}

function checkPoint(x, y) {
	for (var i = 0; i < gnats.length; i++) {
		var gnatObject = gnats[i];
		if (gnatObject) {
			if (gnatObject.alive) {
				if (Math.abs(gnatObject.x - x) < swatThreshold && Math.abs(gnatObject.y - y) < swatThreshold) {
					swatCount++;
					TweenMax.set(".counter text", {
						textContent: swatCount
					});
					TweenMax.killTweensOf(gnatObject);
					TweenMax.killTweensOf(gnatObject.element);
					TweenMax.killChildTweensOf(gnatObject.element);
					
					TweenMax.to(gnatObject.element, 1, {
						y: "+=1000",
						rotation: Math.random() < .5 ? -1000 : 1000,
						transformOrigin: "50% 50%",
						autoAlpha: 0,
						ease: Sine.easeIn,
						onComplete: deleteElement,
						onCompleteParams: [gnatObject.element]
					});
					gnatObject.alive=false;
					gnatObject = null;
				}
			}
		}

	}
}
emitGnats();