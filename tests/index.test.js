/**
 * @jest-environment jsdom
 */

import { YouTubePlayer } from "../src/index"

test('attaches to a DOM node', () => {
  const div = document.createElement("div")
  div.setAttribute("id", "player");
  const player = new YouTubePlayer(div);
  expect(player.getState()).toBe("unstarted")
});