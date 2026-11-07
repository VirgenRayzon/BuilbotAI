import test from 'node:test';
import assert from 'node:assert/strict';
import { hasExactHardwareModelMatch } from './hardware-model-identity';

test('hasExactHardwareModelMatch rejects a nearby CPU model from vector context', () => {
  const vectorContext = '[Hardware Spec: CPU] AMD Ryzen 7 7800X3D\n- Cores: 8';

  assert.equal(hasExactHardwareModelMatch('AMD Ryzen 7 7700X3D', [vectorContext]), false);
});

test('hasExactHardwareModelMatch accepts the requested model despite harmless formatting differences', () => {
  const vectorContext = '[Hardware Spec: CPU] AMD Ryzen™ 7 7700X3D Processor\n- Cores: 8';

  assert.equal(hasExactHardwareModelMatch('amd ryzen 7 7700x3d', [vectorContext]), true);
});

test('hasExactHardwareModelMatch does not treat a shorter base model as the requested variant', () => {
  const vectorContext = '[Hardware Spec: CPU] AMD Ryzen 7 7700\n- Cores: 8';

  assert.equal(hasExactHardwareModelMatch('AMD Ryzen 7 7700X3D', [vectorContext]), false);
});
