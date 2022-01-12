import { FC, useEffect, useRef, useState } from 'react';

import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import { debounce } from '@material-ui/core';

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

const B65 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

const s2 = (s: string) => [...s];

const encode = (str: string, dict65: string): string =>
  s2(str)
    .map((s) => s2(dict65)[B65.indexOf(s)])
    .join('');
const decode = (str: string, dict65: string): string =>
  s2(str)
    .map((s) => B65.charAt(s2(dict65).indexOf(s)))
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
  return dict.length === 65 && new Set(dict).size === 65;
};

interface PopState {
  dict65: string;
  input: string;
  op: Op;
}

const ERRSTR = s2('<错误>').join('\u200b');

const DEFAULT_DICT =
  '富强民主文明和谐自由平等公正法治爱国敬业诚信友善热祖为荣服务人崇尚科学辛勤劳动好团结互助实守见义遵纪艰苦奋斗骄赢奇迹感恩进步梦想😊';

const debouncedPushState = debounce(({ dict65, input, op }: PopState) => {
  const url = new URL(window.location.href);
  if (dict65 !== DEFAULT_DICT) url.searchParams.set('d', dict65);
  if (input) url.searchParams.set('i', input);
  if (op === Op.Decode) url.searchParams.set('op', 'decode');
  window.history.pushState({ dict65, input, op }, document.title, url);
}, 500);

const App: FC = () => {
  const [dict65, setDict65] = useState(DEFAULT_DICT);
  const [input, setInput] = useState('');
  const [op, setOp] = useState(Op.Encode);

  const [output, setOutput] = useState('');

  const outputRef = useRef<HTMLInputElement>();

  const dictIs65 = is65(dict65);

  const outputError = output === ERRSTR;

  useEffect(() => {
    let out = ERRSTR;
    if (dictIs65)
      try {
        out = run(op, dict65, input);
      } catch (_) {}
    setOutput(out);
    if (out !== ERRSTR) {
      debouncedPushState({ dict65, input, op });
    }
  }, [dict65, dictIs65, input, op]);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const d = search.get('d');
    const i = search.get('i');
    const o = search.get('o');
    if (d) setDict65(d);
    if (i) setInput(i);
    if (o === 'decode') setOp(Op.Decode);
    const handlePopstate = ({
      state: { dict65, input, op },
    }: {
      state: PopState;
    }) => {
      setDict65(dict65);
      setInput(input);
      setOp(op);
    };
    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);

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
            error={!dictIs65}
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
            error={outputError && dictIs65}
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
            error={outputError}
            onClick={() => {
              if (output && output !== ERRSTR) {
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
};

export default App;
