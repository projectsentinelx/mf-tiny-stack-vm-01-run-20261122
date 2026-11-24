// tiny-stack-vm-01: make.fun's tiny stack ISA, faithful to generator/subject/vm.mjs: wrapping 32-bit ops, DIVU/MODU/
// LTU, shifts by b&31, PUSH8 sign extension, 256-value stack, 64-deep calls, step and output limits, every trap code.
import { mkdirSync as M, readdirSync as R, readFileSync as F, writeFileSync as W } from 'node:fs';
import { join as J } from 'node:path';
// T[op]=[immediate bytes,popped,pushed]; S holds imm*16+pop*4+push+32 per opcode byte, '~' where no opcode.
const T = [], S = ' 1a$&*+/~~~~~~~~)))))))%)))%)))~)))~~~~~~~~~~~~~@DD@ ~~~~~~~~~~~%(~~~~~~~~~~~~~~$$!$';
for (let o = 0; o < S.length; o++) { const v = S.charCodeAt(o) - 32; if (v < 90) T[o] = [v >> 4, v >> 2 & 3, v & 3]; }
function run(g, inp) {
 const n = g.length, D = new Int32Array(256), C = new Int32Array(64), Mm = new Int32Array(256), O = new Uint8Array(65536);
 let sp = 0, cp = 0, l = 0, ip = 0, pc = 0, s = 0;
 const d = c => [O.subarray(0, l), c];
 for (;;) {
  if (s === 1e6) return d(10);
  if (pc < 0 || pc >= n) return d(9);
  const op = g[pc], t = T[op];
  if (t === undefined) return d(5);
  if (pc + t[0] >= n) return d(9);
  s++;
  const nx = pc + 1 + t[0];
  if (sp < t[1]) return d(2);
  if (sp - t[1] + t[2] > 256) return d(3);
  pc = nx;
  switch (op) {
   case 0: return d(0);
   case 1: D[sp++] = g[nx - 1] << 24 >> 24; break;
   case 2: D[sp++] = g[nx - 4] | g[nx - 3] << 8 | g[nx - 2] << 16 | g[nx - 1] << 24; break;
   case 3: sp--; break;
   case 4: D[sp] = D[sp - 1]; sp++; break;
   case 5: { const v = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = v; break; }
   case 6: D[sp] = D[sp - 2]; sp++; break;
   case 7: { const v = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = v; break; }
   case 23: D[sp - 1] = -D[sp - 1] | 0; break;
   case 27: D[sp - 1] = ~D[sp - 1]; break;
   case 16: case 17: case 18: case 19: case 20: case 21: case 22: case 24: case 25: case 26:
   case 28: case 29: case 30: case 32: case 33: case 34: {
    const b = D[sp - 1], a = D[sp - 2];
    if (op > 18 && op < 23 && b === 0) return d(4);
    let r;
    switch (op) {
     case 16: r = a + b | 0; break;
     case 17: r = a - b | 0; break;
     case 18: r = Math.imul(a, b); break;
     case 19: r = a === -2147483648 && b === -1 ? a : a / b | 0; break;
     case 20: r = b === -1 ? 0 : a % b | 0; break;
     case 21: r = Math.floor((a >>> 0) / (b >>> 0)) | 0; break;
     case 22: r = (a >>> 0) % (b >>> 0) | 0; break;
     case 24: r = a & b; break;
     case 25: r = a | b; break;
     case 26: r = a ^ b; break;
     case 28: r = a << (b & 31); break;
     case 29: r = a >> (b & 31); break;
     case 30: r = a >>> (b & 31) | 0; break;
     case 32: r = a === b ? 1 : 0; break;
     case 33: r = a < b ? 1 : 0; break;
     case 34: r = (a >>> 0) < (b >>> 0) ? 1 : 0; break;
    }
    sp -= 2;
    D[sp++] = r;
    break;
   }
   case 48: case 49: case 50: {
    const rel = g[nx - 2] | g[nx - 1] << 8;
    let take = 1;
    if (op !== 48) { const v = D[--sp]; take = op === 49 ? v === 0 : v !== 0; }
    if (take) pc = nx + (rel << 16 >> 16);
    break;
   }
   case 51: if (cp === 64) return d(7); C[cp++] = nx; pc = g[nx - 2] | g[nx - 1] << 8; break;
   case 52: if (cp === 0) return d(8); pc = C[--cp]; break;
   case 64: { const a = D[sp - 1]; if (a < 0 || a > 255) return d(6); D[sp - 1] = Mm[a]; break; }
   case 65: { const a = D[sp - 1], v = D[sp - 2]; if (a < 0 || a > 255) return d(6); sp -= 2; Mm[a] = v; break; }
   case 80: {
    const b = Buffer.from('' + D[sp - 1]);
    if (l + b.length > 65536) return d(11);
    O.set(b, l); l += b.length; sp--;
    break;
   }
   case 81: if (l === 65536) return d(11); O[l++] = D[--sp] & 255; break;
   case 82: D[sp++] = ip < inp.length ? inp[ip++] : -1; break;
   case 83: return d(D[--sp] & 255);
  }
 }
}
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', U = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of R(I).sort()) {
 const [o, c] = run(F(J(I, id, 'program.bin')), F(J(I, id, 'input.bin')));
 M(J(U, id), { recursive: true });
 W(J(U, id, 'stdout.bin'), o);
 W(J(U, id, 'exit.txt'), '' + c);
}
