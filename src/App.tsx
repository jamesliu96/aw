import React, { useEffect, useRef, useState } from 'react';

import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';

enum Op {
  Encode,
  Decode,
}

function toBin(str: string) {
  const codes = new Uint16Array(str.length);
  for (let i = 0; i < codes.length; i++) codes[i] = str.charCodeAt(i);
  return btoa(String.fromCharCode(...new Uint8Array(codes.buffer)));
}
function fromBin(str: string) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < bytes.length; i++) bytes[i] = binary.charCodeAt(i);
  return String.fromCharCode(...new Uint16Array(bytes.buffer));
}

const b65 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

const s2 = (s: string) => [...s];

const encode = (str: string, dict65: string): string =>
  s2(str)
    .map((s) => s2(dict65)[b65.indexOf(s)])
    .join('');
const decode = (str: string, dict65: string): string =>
  s2(str)
    .map((s) => b65.charAt(s2(dict65).indexOf(s)))
    .join('');
const validate = (str: string, dict65: string): boolean =>
  !s2(str).some((s) => s2(dict65).indexOf(s) < 0);

function run(op: Op, dict65: string, input: string): string {
  switch (op) {
    case Op.Encode: {
      return encode(toBin(input), dict65);
    }
    case Op.Decode: {
      if (!validate(input, dict65)) throw new Error('execution failed');
      return fromBin(decode(input, dict65));
    }
  }
}

const is65 = (dict65: string) => {
  const dict = s2(dict65);
  return dict.length === 65 && [...new Set(dict)].length === 65;
};

const errorStr = s2('<错误>').join('\u200b');

function App() {
  const [dict65, setDict65] = useState(
    '富强民主文明和谐自由平等公正法治爱国敬业诚信友善热祖为荣服务人崇尚科学辛勤劳动好团结互助实守见义遵纪艰苦奋斗骄赢奇迹感恩进步梦想😊'
  );
  const [input, setInput] = useState('');
  const [op, setOp] = useState(Op.Encode);

  const [output, setOutput] = useState('');

  const outputRef = useRef<HTMLInputElement>();

  useEffect(() => {
    let out = errorStr;
    if (is65(dict65))
      try {
        out = run(op, dict65, input);
      } catch (_) {}
    setOutput(out);
  }, [dict65, input, op]);

  return (
    <div>
      <Grid
        container
        component="div"
        direction="column"
        justify="center"
        alignItems="center"
        spacing={1}
        style={{ margin: '20px 0' }}
      >
        <Grid item>
          <TextField
            multiline
            rows={5}
            label="字典"
            variant="outlined"
            value={dict65}
            error={!is65(dict65)}
            helperText="65个唯一字符"
            style={{ width: 300 }}
            onChange={(e) => setDict65(e.currentTarget.value)}
          />
        </Grid>
        <Grid item>
          <TextField
            multiline
            rows={10}
            label="输入"
            variant="outlined"
            value={input}
            error={output === errorStr && is65(dict65)}
            style={{ width: 300 }}
            onChange={(e) => setInput(e.currentTarget.value)}
          />
        </Grid>
        <Grid item>
          <Grid container component="label" alignItems="center">
            <Grid item>编码</Grid>
            <Grid item>
              <Switch
                color="primary"
                checked={op === Op.Decode}
                onChange={() =>
                  setOp((op) => (op === Op.Decode ? Op.Encode : Op.Decode))
                }
              />
            </Grid>
            <Grid item>解码</Grid>
          </Grid>
        </Grid>
        <Grid item>
          <TextField
            multiline
            rows={10}
            label="输出"
            variant="outlined"
            value={output}
            style={{ width: 300 }}
            InputProps={{ readOnly: true }}
            inputRef={outputRef}
            error={output === errorStr}
            onClick={() => {
              if (output && output !== errorStr) {
                outputRef.current?.select();
                if (navigator.clipboard) navigator.clipboard.writeText(output);
                else document.execCommand('copy');
              }
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
