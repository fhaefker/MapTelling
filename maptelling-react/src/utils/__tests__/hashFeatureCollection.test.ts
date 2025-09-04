import { hashFeatureCollection } from '../hashFeatureCollection';

const fcA = { type:'FeatureCollection', features:[{ type:'Feature', id:'1', properties:{a:1}, geometry:{ type:'LineString', coordinates:[[0,0],[1,1]] }}] } as any;
const fcB = { type:'FeatureCollection', features:[{ type:'Feature', id:'1', properties:{a:1}, geometry:{ type:'LineString', coordinates:[[0,0],[1,2]] }}] } as any;

describe('hashFeatureCollection', () => {
  it('differs for changed coordinates', () => {
    const h1 = hashFeatureCollection(fcA);
    const h2 = hashFeatureCollection(fcB);
    expect(h1).not.toEqual(h2);
  });
  it('stable for identical input', () => {
    const h1 = hashFeatureCollection(fcA);
    const h2 = hashFeatureCollection(JSON.parse(JSON.stringify(fcA)));
    expect(h1).toEqual(h2);
  });
});
