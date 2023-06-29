import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";
const Header = () => {
  const { data: sessionData } = useSession();

  const onLogOut = () => {
    void signOut();
  };
  return (
    <div className="navbar bg-primary text-primary-content">
      <div className="flex-1 pl-5 text-3xl font-bold">
        {sessionData?.user?.name ? `Notes for ${sessionData.user.name}` : ""}
      </div>

      <div className="dropdown-end dropdown">
        {sessionData?.user.image && (
          <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
            <div className="w-10 rounded-full">
              <img src={sessionData?.user.image} />
            </div>
          </label>
        )}
        <ul
          tabIndex={0}
          className="dropdown-content menu rounded-box menu-sm z-[1] mt-3 w-52 bg-base-100 p-2 shadow"
        >
          {/*    <li>
            <a className="justify-between">
              Profile 
              <span className="badge">New</span>
            </a>
          </li> */}

          <li>
            <a onClick={onLogOut}>Logout</a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
