import { useDispatch, useSelector } from "react-redux";
import { closeDialog, setDialog } from "../features/Dialog/DialogSlice";
import { ReduxRootState } from "../store";
import { ObjectAny } from "@shared/types/general";
import { MyClientSocket } from "../features/ClientSocket/ClientSocketHandler";
import { setAlert } from "../features/Alert/AlertSlice";

type useChangeUsernameWithDialogCallback = (v?: boolean, username?: string) => any
export function useChangeUsernameWithDialog() {
  const dispatch = useDispatch();
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);

  function handleUpdateUsername(callback?: useChangeUsernameWithDialogCallback) {
      dispatch(
        setDialog({
          title: "Change Username",
          subtitle:
            "Change your username to whatever you want (assuming it's available)",
          inputs: [
            {
              label: "New Username",
              name: "username",
              type: "text",
              placeholder: "KingSlayer550",
              initialValue: user?.username || '',
            },
          ],
          buttons: [
            {
              useDisableTill: true,
              text: "Change username",
              onClick: (a, b) => handleUpdateUsernameSubmit(a, b, callback),
            },
          ],
          buttonContainerStyle: {
            justifyContent: "end",
          },
        })
      );
    }

    function handleUpdateUsernameSubmit(
        formParams: ObjectAny,
        enableCallback?: Function,
        optionalCallback?: useChangeUsernameWithDialogCallback
      ) {
        console.log("sending update profile", formParams);
        const { username } = formParams;
        if (!username) {
          enableCallback && enableCallback();
          optionalCallback && optionalCallback(false);
          return;
        }
        MyClientSocket?.UpdateProfile({ username }).then((v: boolean) => {
          optionalCallback && optionalCallback(v, username);
          enableCallback && enableCallback();
          v &&
            (() => {
              dispatch(closeDialog());
              dispatch(
                setAlert({
                  title: "Username changed!",
                  body: `Enjoy your new username, ${username}.`,
                })
              );
            })();
        });
      }
  return handleUpdateUsername;
}