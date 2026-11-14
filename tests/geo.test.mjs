import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../geo.js';

test('distance and points match the server formula',()=>{
 const marseille=[43.3,5.37],paris=[48.8566,2.3522];
 const d=G.haversine(marseille,paris);assert.ok(Math.abs(d-660.1)<1,String(d));
 assert.equal(G.pointsFor(0),5000);assert.equal(G.pointsFor(d),3220);assert.ok(G.pointsFor(20000)<10);
 assert.ok(Math.abs(G.haversine([0,179.5],[0,-179.5])-111.2)<1,'across the date line');
});

test('longitudes wrap and lines take the short way',()=>{
 assert.equal(G.wrapLng(190),-170);assert.equal(G.wrapLng(-540),180-360);assert.equal(G.wrapLng(5.37),5.37);
 assert.equal(G.nearLng(-170,175),190);assert.ok(Math.abs(G.nearLng(2.35+360,5.37)-2.35)<1e-9);
});

test('formatting and sizes',()=>{
 assert.equal(G.fmtDist(.25),'250 m');assert.equal(G.fmtDist(3.42,true),'3.4 km');assert.match(G.fmtDist(1318),/^1\s?318 km$/);
 assert.deepEqual(G.fitSize(1920,1440,1024),[1024,768]);assert.deepEqual(G.fitSize(640,480,1024),[640,480]);
 const now=Date.parse('2026-11-15T12:00:00Z');assert.equal(G.since('2026-11-15T09:00:00Z',now),'il y a 3 h');assert.equal(G.hoursLeft('2026-11-15T09:00:00Z',now),45);
});
